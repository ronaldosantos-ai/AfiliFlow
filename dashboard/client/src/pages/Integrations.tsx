import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";

export default function Integrations() {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, any>>({
    meta: {
      metaAppId: "",
      metaAppSecret: "",
      metaPageAccessToken: "",
      metaPageId: "",
      metaInstagramAccountId: "",
    },
    telegram: {
      telegramBotToken: "",
      telegramChatId: "",
    },
    shopee: {
      shopeeApiKey: "",
      shopeePartnerId: "",
    },
    gtm: {
      gtmId: "",
    },
  });

  const updateSettingsMutation = trpc.admin.updateIntegrationSettings.useMutation();

  const handleInputChange = (integration: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [integration]: {
        ...prev[integration],
        [field]: value,
      },
    }));
  };

  const handleSave = async (integration: string) => {
    try {
      await updateSettingsMutation.mutateAsync({
        integrationName: integration,
        settings: formData[integration],
      });
      toast.success(`${integration.toUpperCase()} configurado com sucesso!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    }
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const IntegrationField = ({
    label,
    value,
    onChange,
    placeholder,
    isSecret = false,
    fieldKey,
  }: any) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex gap-2">
        <Input
          type={isSecret && !showSecrets[fieldKey] ? "password" : "text"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-slate-900 border-slate-700 text-white"
        />
        {isSecret && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleShowSecret(fieldKey)}
          >
            {showSecrets[fieldKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Integrações</h1>
          <p className="text-muted-foreground mt-1">Configure APIs e serviços externos</p>
        </div>

        {/* Meta API */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Meta API (Instagram & Facebook)</CardTitle>
                <CardDescription>Configure acesso à Meta para publicar em Instagram e Facebook</CardDescription>
              </div>
              <Badge className="bg-blue-600">Integrado</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <IntegrationField
              label="App ID"
              value={formData.meta.metaAppId}
              onChange={(v: string) => handleInputChange("meta", "metaAppId", v)}
              placeholder="Seu Meta App ID"
              isSecret
              fieldKey="metaAppId"
            />
            <IntegrationField
              label="App Secret"
              value={formData.meta.metaAppSecret}
              onChange={(v: string) => handleInputChange("meta", "metaAppSecret", v)}
              placeholder="Seu Meta App Secret"
              isSecret
              fieldKey="metaAppSecret"
            />
            <IntegrationField
              label="Page Access Token"
              value={formData.meta.metaPageAccessToken}
              onChange={(v: string) => handleInputChange("meta", "metaPageAccessToken", v)}
              placeholder="Token de acesso da página"
              isSecret
              fieldKey="metaPageAccessToken"
            />
            <IntegrationField
              label="Page ID"
              value={formData.meta.metaPageId}
              onChange={(v: string) => handleInputChange("meta", "metaPageId", v)}
              placeholder="ID da página do Facebook"
            />
            <IntegrationField
              label="Instagram Account ID"
              value={formData.meta.metaInstagramAccountId}
              onChange={(v: string) => handleInputChange("meta", "metaInstagramAccountId", v)}
              placeholder="ID da conta do Instagram"
            />
            <Button
              onClick={() => handleSave("meta")}
              disabled={updateSettingsMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configuração Meta"}
            </Button>
          </CardContent>
        </Card>

        {/* Telegram */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Telegram</CardTitle>
                <CardDescription>Configure bot do Telegram para publicar ofertas</CardDescription>
              </div>
              <Badge className="bg-blue-400">Ativo</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <IntegrationField
              label="Bot Token"
              value={formData.telegram.telegramBotToken}
              onChange={(v: string) => handleInputChange("telegram", "telegramBotToken", v)}
              placeholder="Token do seu bot Telegram"
              isSecret
              fieldKey="telegramBotToken"
            />
            <IntegrationField
              label="Chat ID"
              value={formData.telegram.telegramChatId}
              onChange={(v: string) => handleInputChange("telegram", "telegramChatId", v)}
              placeholder="ID do chat/canal Telegram"
            />
            <Button
              onClick={() => handleSave("telegram")}
              disabled={updateSettingsMutation.isPending}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configuração Telegram"}
            </Button>
          </CardContent>
        </Card>

        {/* Shopee */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Shopee</CardTitle>
                <CardDescription>Configure acesso à API da Shopee para buscar produtos</CardDescription>
              </div>
              <Badge className="bg-orange-600">Ativo</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <IntegrationField
              label="API Key"
              value={formData.shopee.shopeeApiKey}
              onChange={(v: string) => handleInputChange("shopee", "shopeeApiKey", v)}
              placeholder="Sua API Key da Shopee"
              isSecret
              fieldKey="shopeeApiKey"
            />
            <IntegrationField
              label="Partner ID"
              value={formData.shopee.shopeePartnerId}
              onChange={(v: string) => handleInputChange("shopee", "shopeePartnerId", v)}
              placeholder="Seu Partner ID da Shopee"
            />
            <Button
              onClick={() => handleSave("shopee")}
              disabled={updateSettingsMutation.isPending}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configuração Shopee"}
            </Button>
          </CardContent>
        </Card>

        {/* GTM */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Google Tag Manager</CardTitle>
                <CardDescription>Configure GTM para rastreamento de eventos (opcional - não ativo ainda)</CardDescription>
              </div>
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                Opcional
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <IntegrationField
              label="GTM ID"
              value={formData.gtm.gtmId}
              onChange={(v: string) => handleInputChange("gtm", "gtmId", v)}
              placeholder="GTM-XXXXXXX"
            />
            <p className="text-sm text-muted-foreground">
              O GTM será configurado mas não ativado por enquanto. Você poderá ativar quando estiver pronto.
            </p>
            <Button
              onClick={() => handleSave("gtm")}
              disabled={updateSettingsMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configuração GTM"}
            </Button>
          </CardContent>
        </Card>

        {/* Removed Integrations */}
        <Card className="bg-card border-border border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-500">Integrações Removidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Buffer foi removido. Use Meta API diretamente para Instagram e Facebook.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
