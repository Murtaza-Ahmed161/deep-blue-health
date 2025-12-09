import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Ticket, Plus, Copy, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BetaInviteCode {
  id: string;
  code: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export const BetaInviteManager = () => {
  const [codes, setCodes] = useState<BetaInviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [maxUses, setMaxUses] = useState(10);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [creating, setCreating] = useState(false);

  const fetchCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("beta_invite_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCodes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "NEURAL-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(code);
  };

  const handleCreateCode = async () => {
    if (!newCode.trim()) {
      toast({ title: "Error", description: "Please enter a code", variant: "destructive" });
      return;
    }

    setCreating(true);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { error } = await supabase.from("beta_invite_codes").insert({
      code: newCode.toUpperCase(),
      max_uses: maxUses,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Invite code created" });
      setCreateOpen(false);
      setNewCode("");
      fetchCodes();
    }
    setCreating(false);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("beta_invite_codes")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (!error) {
      fetchCodes();
      toast({ title: isActive ? "Code Deactivated" : "Code Activated" });
    }
  };

  const handleDeleteCode = async (id: string) => {
    const { error } = await supabase.from("beta_invite_codes").delete().eq("id", id);

    if (!error) {
      fetchCodes();
      toast({ title: "Code Deleted" });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Invite code copied to clipboard" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <CardTitle>Beta Invite Codes</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCodes}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Beta Invite Code</DialogTitle>
                  <DialogDescription>
                    Generate a new invite code for beta testers
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Invite Code</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        placeholder="NEURAL-XXXXXX"
                      />
                      <Button variant="outline" onClick={generateRandomCode}>
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Uses</Label>
                      <Input
                        type="number"
                        value={maxUses}
                        onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expires In (Days)</Label>
                      <Input
                        type="number"
                        value={expiresInDays}
                        onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
                        min={1}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCode} disabled={creating}>
                    Create Code
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <CardDescription>
          Manage invite codes for beta tester onboarding
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading codes...</div>
        ) : codes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No invite codes yet. Create one to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => {
                const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
                const isFull = code.current_uses >= code.max_uses;
                
                return (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-medium">{code.code}</TableCell>
                    <TableCell>
                      <span className={isFull ? "text-destructive" : ""}>
                        {code.current_uses} / {code.max_uses}
                      </span>
                    </TableCell>
                    <TableCell>
                      {code.expires_at ? (
                        <span className={isExpired ? "text-destructive" : ""}>
                          {format(new Date(code.expires_at), "MMM d, yyyy")}
                        </span>
                      ) : (
                        "Never"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          !code.is_active || isExpired || isFull
                            ? "secondary"
                            : "default"
                        }
                      >
                        {!code.is_active
                          ? "Inactive"
                          : isExpired
                          ? "Expired"
                          : isFull
                          ? "Full"
                          : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={code.is_active}
                          onCheckedChange={() => handleToggleActive(code.id, code.is_active)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCode(code.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
