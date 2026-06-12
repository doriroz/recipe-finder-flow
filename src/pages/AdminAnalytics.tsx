import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  Download,
  TrendingUp,
  ShieldOff,
  Loader2,
  ArrowRight,
  Cpu,
  Leaf,
  Search,
  UserPlus,
  Activity,
  Copy,
  Plus,
  Save,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGoBack } from "@/hooks/useGoBack";

interface AiLogEntry {
  id: string;
  created_at: string;
  action_type: string;
  source: string;
  credits_used: number;
  tokens_estimated: number;
}

interface AnalyticsData {
  disabled: boolean;
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    pdfDownloads: number;
    conversionRate: number;
  };
  byEvent: Record<string, number>;
  daily: { date: string; count: number }[];
  aiUsage?: {
    bySource: Record<string, number>;
    byAction: Record<string, number>;
    totalCreditsConsumed: number;
    recentLogs: AiLogEntry[];
  };
  userStats?: {
    activeUserIds7d: string[];
    downloadsByUser: Record<string, number>;
  };
}

type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  credits: { credits_remaining: number; daily_ai_calls: number; total_ai_calls: number } | null;
};

