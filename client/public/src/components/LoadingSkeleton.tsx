import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'table' | 'list' | 'dashboard' | 'subscription';
  count?: number;
}

export function LoadingSkeleton({ className = "", variant = 'card', count = 1 }: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`space-y-4 ${className}`}>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </div>
        );
      
      case 'table':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        );
      
      case 'list':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'dashboard':
        return (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-gray-700 rounded-lg p-4 space-y-4">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'subscription':
        return (
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-gray-700 rounded-xl p-6 space-y-4">
                <Skeleton className="h-8 w-24 mx-auto" />
                <Skeleton className="h-12 w-32 mx-auto" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        );
      
      default:
        return <Skeleton className={`h-4 w-full ${className}`} />;
    }
  };

  return renderSkeleton();
}

// Individual skeleton components for specific use cases
export function PlayerCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`border border-gray-700 rounded-lg p-4 space-y-3 ${className}`}>
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export function TournamentCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`border border-gray-700 rounded-lg p-6 space-y-4 ${className}`}>
      <Skeleton className="h-6 w-3/4" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}