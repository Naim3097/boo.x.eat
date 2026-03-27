"use client";

import { Lock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface UpgradePromptProps {
  feature: string;
  requiredTier?: string;
  currentTier?: string;
}

export function UpgradePrompt({ feature, requiredTier = "growth", currentTier = "starter" }: UpgradePromptProps) {
  const tierNames: Record<string, string> = { starter: "Starter", growth: "Growth", pro: "Pro" };

  return (
    <Card className="border-dashed border-2 border-primary-200 bg-primary-50/50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {feature}
        </h3>
        <p className="text-sm text-gray-500 mb-4 max-w-sm">
          This feature is available on the{" "}
          <span className="font-semibold text-primary-700">{tierNames[requiredTier] || "Growth"}</span>{" "}
          plan and above. You&apos;re currently on{" "}
          <span className="font-medium">{tierNames[currentTier] || "Starter"}</span>.
        </p>
        <Link href="/dashboard/settings">
          <Button className="bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
