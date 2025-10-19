import { Request, Response } from "express";
import { z } from "zod";
import { 
  getActiveConfig, 
  setActiveConfig, 
  getAllConfigs, 
  createCustomConfig,
  validateRevenueConfig,
  type RevenueConfig 
} from "../config/revenueConfig";
import { 
  RevenueConfigService,
  activateConfig as activateConfigInDb
} from "../services/revenueConfigService";

// Validation schemas
const RevenueConfigSchema = z.object({
  name: z.string().min(1, "Configuration name is required"),
  splitPercentages: z.object({
    actionLadder: z.number().min(0).max(100),
    operator: z.number().min(0).max(100),
    seasonPot: z.number().min(0).max(100),
    monthlyOperations: z.number().min(0).max(100),
  }),
  commissionRates: z.object({
    nonMember: z.number().min(0).max(5000),
    rookie: z.number().min(0).max(5000),
    standard: z.number().min(0).max(5000),
    premium: z.number().min(0).max(5000),
  }),
  membershipPricing: z.object({
    rookie: z.number().min(1),
    standard: z.number().min(1),
    premium: z.number().min(1),
  }),
  settings: z.object({
    roundUpEnabled: z.boolean(),
    operatorMonthlyTarget: z.number().min(0),
    trusteeWeeklyTarget: z.number().min(0),
  }),
  modifiedBy: z.string().min(1),
});

// Authentication middleware for admin routes
export function requireAdmin(req: any, res: any, next: any) {
  // Check if user is authenticated and has admin role
  const user = req.session?.user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required"
    });
  }

  // Check for admin roles (OWNER, TRUSTEE, or OPERATOR)
  if (!['OWNER', 'TRUSTEE', 'OPERATOR'].includes(user.globalRole)) {
    return res.status(403).json({
      success: false,
      error: "Admin access required"
    });
  }

  next();
}

// Helper function to calculate revenue preview
function calculatePreview(amount: number, commissionBps: number, splitPercentages: any) {
  const commissionAmount = Math.floor((amount * commissionBps) / 10000);
  const prizePool = amount - commissionAmount;
  
  const actionLadderShare = Math.floor(commissionAmount * (splitPercentages.actionLadder / 100));
  const operatorShare = Math.floor(commissionAmount * (splitPercentages.operator / 100));
  const seasonPotShare = Math.floor(commissionAmount * (splitPercentages.seasonPot / 100));
  const operationsShare = Math.floor(commissionAmount * (splitPercentages.monthlyOperations / 100));
  
  return {
    totalAmount: amount,
    commissionAmount,
    commissionRate: `${commissionBps / 100}%`,
    prizePool,
    distributions: {
      actionLadder: actionLadderShare,
      operator: operatorShare,
      seasonPot: seasonPotShare,
      operations: operationsShare,
    }
  };
}

// Get current active revenue configuration
export function getActiveRevenueConfig(req: Request, res: Response) {
  try {
    const config = getActiveConfig();
    res.json({
      success: true,
      config,
      message: "Current revenue configuration retrieved"
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to get revenue configuration",
      message: error.message
    });
  }
}

// Get all available revenue configurations
export async function getAllRevenueConfigs(req: Request, res: Response) {
  try {
    const service = RevenueConfigService.getInstance();
    const configs = await service.getAllConfigs();
    const activeConfig = service.getActiveConfig();
    
    res.json({
      success: true,
      configs,
      activeConfigId: activeConfig.id,
      message: "All revenue configurations retrieved"
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to get revenue configurations",
      message: error.message
    });
  }
}

// Set active revenue configuration
export async function activateRevenueConfig(req: Request, res: Response) {
  try {
    const { configId, modifiedBy } = req.body;
    
    if (!configId) {
      return res.status(400).json({
        success: false,
        error: "Configuration ID is required"
      });
    }

    // Find the configuration
    const allConfigs = getAllConfigs();
    const configToActivate = allConfigs.find(c => c.id === configId);
    
    if (!configToActivate) {
      return res.status(404).json({
        success: false,
        error: "Configuration not found"
      });
    }

    // Activate configuration in database
    const result = await activateConfigInDb(configId, modifiedBy || "admin");

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Failed to activate configuration",
        errors: result.errors
      });
    }

    res.json({
      success: true,
      config: getActiveConfig(),
      message: `Configuration "${configToActivate.name}" activated successfully`
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to activate configuration",
      message: error.message
    });
  }
}

// Create and activate custom revenue configuration
export async function createRevenueConfig(req: Request, res: Response) {
  try {
    const validatedData = RevenueConfigSchema.parse(req.body);
    
    // Create configuration object
    const newConfig: RevenueConfig = {
      id: `custom_${Date.now()}`,
      name: validatedData.name,
      splitPercentages: validatedData.splitPercentages,
      commissionRates: validatedData.commissionRates,
      membershipPricing: validatedData.membershipPricing,
      settings: validatedData.settings,
      lastModified: new Date(),
      modifiedBy: validatedData.modifiedBy
    };

    // Save and activate via service
    const service = RevenueConfigService.getInstance();
    const result = await service.setActiveConfig(newConfig);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Failed to save configuration",
        errors: result.errors
      });
    }

    res.status(201).json({
      success: true,
      config: service.getActiveConfig(),
      message: `Custom configuration "${validatedData.name}" created and activated`
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create configuration",
      message: error.message
    });
  }
}

// Update existing configuration (creates new version)
export async function updateRevenueConfig(req: Request, res: Response) {
  try {
    const validatedData = RevenueConfigSchema.parse(req.body);
    
    // Validate the configuration
    const errors = validateRevenueConfig(validatedData as RevenueConfig);
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid configuration",
        errors
      });
    }

    // Create new configuration with updated values
    const updatedConfig: RevenueConfig = {
      id: `updated_${Date.now()}`,
      name: validatedData.name,
      splitPercentages: validatedData.splitPercentages,
      commissionRates: validatedData.commissionRates,
      membershipPricing: validatedData.membershipPricing,
      settings: validatedData.settings,
      lastModified: new Date(),
      modifiedBy: validatedData.modifiedBy
    };

    // Set as active
    const result = setActiveConfig(updatedConfig);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Failed to update configuration",
        errors: result.errors
      });
    }

    res.json({
      success: true,
      config: getActiveConfig(),
      message: "Configuration updated and activated successfully"
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update configuration",
      message: error.message
    });
  }
}

// Validate a configuration without saving
export function validateConfig(req: Request, res: Response) {
  try {
    const config = req.body as RevenueConfig;
    const errors = validateRevenueConfig(config);
    
    res.json({
      success: errors.length === 0,
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      message: errors.length === 0 ? "Configuration is valid" : "Configuration has errors"
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to validate configuration",
      message: error.message
    });
  }
}

// Get revenue calculation preview with different configurations
export function previewRevenue(req: Request, res: Response) {
  try {
    const { config, testAmount = 10000 } = req.body; // Default $100 test amount
    
    if (!config) {
      return res.status(400).json({
        success: false,
        error: "Configuration is required for preview"
      });
    }

    // Calculate preview for different membership tiers
    const previews = {
      nonMember: calculatePreview(testAmount, config.commissionRates.nonMember, config.splitPercentages),
      rookie: calculatePreview(testAmount, config.commissionRates.rookie, config.splitPercentages),
      standard: calculatePreview(testAmount, config.commissionRates.standard, config.splitPercentages),
      premium: calculatePreview(testAmount, config.commissionRates.premium, config.splitPercentages),
    };

    res.json({
      success: true,
      testAmount,
      previews,
      message: "Revenue calculation preview generated"
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Failed to generate preview",
      message: error.message
    });
  }
}
