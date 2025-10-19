import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Mail, Lock, Shield } from "lucide-react";
import { z } from "zod";
import { Link } from "wouter";

const trusteeLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional(),
});

type TrusteeLoginFormData = z.infer<typeof trusteeLoginSchema>;

export default function TrusteeLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const { toast } = useToast();

  const form = useForm<TrusteeLoginFormData>({
    resolver: zodResolver(trusteeLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      twoFactorCode: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: TrusteeLoginFormData) => apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: (response: any) => {
      if (response.requires2FA) {
        setRequires2FA(true);
        toast({
          title: "2FA Required",
          description: "Please enter your two-factor authentication code.",
        });
      } else {
        const user = response.user;
        if (user?.globalRole !== "TRUSTEE") {
          toast({
            title: "Access Denied",
            description: "This login is for Trustee accounts only.",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Welcome Back, Trustee!",
          description: "Login successful.",
        });
        
        window.location.href = "/trustee-dashboard";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TrusteeLoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-felt-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/60 backdrop-blur-sm border border-blue-400/30 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-300">
            Trustee Login
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Access your trustee dashboard
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-300">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="trustee@actionladder.com"
                          className="pl-10 bg-gray-900/50 border-gray-600 text-white focus:border-blue-400"
                          data-testid="input-email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-300">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10 bg-gray-900/50 border-gray-600 text-white focus:border-blue-400"
                          data-testid="input-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {requires2FA && (
                <FormField
                  control={form.control}
                  name="twoFactorCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-300">Two-Factor Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="000000"
                          className="bg-gray-900/50 border-gray-600 text-white text-center tracking-widest focus:border-blue-400"
                          maxLength={6}
                          data-testid="input-2fa-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In as Trustee"}
              </Button>
            </form>
          </Form>

          <div className="text-center space-y-2">
            <Link href="/forgot-password">
              <a className="text-sm text-blue-400 hover:text-blue-300 hover:underline" data-testid="link-forgot-password">
                Forgot Password?
              </a>
            </Link>
            <div className="pt-2">
              <Link href="/login">
                <a className="text-sm text-gray-400 hover:text-white hover:underline" data-testid="link-general-login">
                  Back to General Login
                </a>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
