"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { MarinaLogo } from "@/components/layouts/marina-logo";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/20 px-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-lg border-border/60">
          <CardHeader className="space-y-4 pb-4 text-center">
            <div className="flex justify-center">
              <MarinaLogo size="lg" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Welcome to SlipSync
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to manage your marina
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <form action={formAction} className="space-y-4">
              {state?.error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@slipsync.app"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full"
              >
                {isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>

          <CardFooter>
            <div className="w-full space-y-2 rounded-md bg-muted/50 p-3 text-center">
              <p className="text-xs font-medium text-muted-foreground">
                Demo Accounts
              </p>
              <div className="space-y-1 text-xs text-muted-foreground/80">
                <p>
                  <span className="font-medium">Admin:</span> admin@slipsync.app
                </p>
                <p>
                  <span className="font-medium">Staff:</span> dock@slipsync.app
                </p>
                <p>
                  <span className="font-medium">Boater:</span> boater@slipsync.app
                </p>
                <p className="pt-1 text-muted-foreground/60">
                  Password for all: demo1234
                </p>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
