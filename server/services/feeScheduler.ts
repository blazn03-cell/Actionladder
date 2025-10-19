import * as cron from 'node-cron';
import { AutoFeeEvaluator } from './autoFeeEvaluator';
import { IStorage } from '../storage';
import Stripe from 'stripe';

export class FeeScheduler {
  private evaluator: AutoFeeEvaluator;
  private isRunning = false;
  private tasks: cron.ScheduledTask[] = [];

  constructor(storage: IStorage, stripe: Stripe) {
    this.evaluator = new AutoFeeEvaluator(storage, stripe);
  }

  /**
   * Start the fee evaluation scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('Fee scheduler is already running');
      return;
    }

    // Run every 30 minutes
    const mainTask = cron.schedule('*/30 * * * *', async () => {
      try {
        console.log('Running automatic fee evaluation...');
        
        // First, evaluate new challenges for fees
        const newFeeResults = await this.evaluator.evaluateAllChallenges();
        
        // Then, retry pending fees
        const pendingFeeResults = await this.evaluator.processPendingFees();
        
        const allResults = [...newFeeResults, ...pendingFeeResults];
        const applied = allResults.filter(r => r.applied);
        const failed = allResults.filter(r => !r.applied);
        
        if (applied.length > 0 || failed.length > 0) {
          console.log(`Fee evaluation complete: ${applied.length} fees applied (${newFeeResults.filter(r => r.applied).length} new, ${pendingFeeResults.filter(r => r.applied).length} retries), ${failed.length} failed`);
        }
      } catch (error) {
        console.error('Error in automatic fee evaluation:', error);
      }
    });

    // Run at startup (after 1 minute delay)
    const startupTask = setTimeout(async () => {
      console.log('Running initial fee evaluation...');
      try {
        await this.evaluator.evaluateAllChallenges();
        console.log('Initial fee evaluation complete');
      } catch (error) {
        console.error('Error in initial fee evaluation:', error);
      }
    }, 60000);

    this.tasks.push(mainTask);
    this.isRunning = true;
    
    console.log('Fee scheduler started - running every 30 minutes');
  }

  /**
   * Stop the fee evaluation scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('Fee scheduler is not running');
      return;
    }

    this.tasks.forEach(task => {
      if ('destroy' in task) {
        task.destroy();
      }
    });
    
    this.tasks = [];
    this.isRunning = false;
    console.log('Fee scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: this.tasks.length
    };
  }

  /**
   * Manual fee evaluation trigger
   */
  async runEvaluation() {
    try {
      console.log('Running manual fee evaluation...');
      
      // Evaluate new fees
      const newFeeResults = await this.evaluator.evaluateAllChallenges();
      
      // Process pending fees
      const pendingFeeResults = await this.evaluator.processPendingFees();
      
      const allResults = [...newFeeResults, ...pendingFeeResults];
      
      return {
        success: true,
        results: allResults,
        summary: {
          total: allResults.length,
          applied: allResults.filter(r => r.applied).length,
          failed: allResults.filter(r => !r.applied).length,
          newFees: newFeeResults.length,
          pendingRetries: pendingFeeResults.length
        }
      };
    } catch (error: any) {
      console.error('Error in manual fee evaluation:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Process pending fees only (manual trigger)
   */
  async processPendingFees() {
    try {
      console.log('Processing pending fees...');
      const results = await this.evaluator.processPendingFees();
      
      return {
        success: true,
        results,
        summary: {
          total: results.length,
          applied: results.filter(r => r.applied).length,
          failed: results.filter(r => !r.applied).length
        }
      };
    } catch (error: any) {
      console.error('Error processing pending fees:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Evaluate specific challenge manually
   */
  async evaluateChallenge(challengeId: string) {
    try {
      const results = await this.evaluator.evaluateSpecificChallenge(challengeId);
      return {
        success: true,
        results,
        summary: {
          total: results.length,
          applied: results.filter(r => r.applied).length,
          failed: results.filter(r => !r.applied).length
        }
      };
    } catch (error: any) {
      console.error(`Error evaluating challenge ${challengeId}:`, error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }
}

// Global instance
let schedulerInstance: FeeScheduler | null = null;

export function initializeFeeScheduler(storage: IStorage, stripe: Stripe) {
  if (!schedulerInstance) {
    schedulerInstance = new FeeScheduler(storage, stripe);
    schedulerInstance.start();
  }
  return schedulerInstance;
}

export function getFeeScheduler(): FeeScheduler | null {
  return schedulerInstance;
}