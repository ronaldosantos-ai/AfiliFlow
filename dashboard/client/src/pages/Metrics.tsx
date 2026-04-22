import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Send, AlertCircle, CheckCircle } from "lucide-react";

const metricsData = [
  { date: "Seg", posts: 12, success: 10, failed: 2 },
  { date: "Ter", posts: 19, success: 18, failed: 1 },
  { date: "Qua", posts: 15, success: 14, failed: 1 },
  { date: "Qui", posts: 22, success: 21, failed: 1 },
  { date: "Sex", posts: 25, success: 24, failed: 1 },
  { date: "Sab", posts: 18, success: 17, failed: 1 },
  { date: "Dom", posts: 14, success: 13, failed: 1 },
];

const channelData = [
  { name: "Telegram", value: 45, fill: "#FF6B35" },
  { name: "Instagram", value: 30, fill: "#7C3AED" },
  { name: "Facebook", value: 25, fill: "#FF8A50" },
];

const categoryData = [
  { category: "Eletrônicos", count: 28 },
  { category: "Casa e Cozinha", count: 22 },
  { category: "Esportes", count: 18 },
  { category: "Beleza", count: 15 },
];

export default function Metrics() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard de Métricas</h1>
            <p className="text-muted-foreground mt-1">Acompanhe o desempenho do seu pipeline de publicação</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Publicado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">125</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-accent" />
                +12% esta semana
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">94.4%</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-accent" />
                118 de 125 publicadas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Falhas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">7</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-destructive" />
                5.6% de taxa de erro
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Execuções Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">8</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Send className="w-3 h-3 text-accent" />
                Próxima em 2h 30m
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart - Publicações por Dia */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle>Publicações por Dia</CardTitle>
              <CardDescription>Últimos 7 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="posts"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ fill: "var(--primary)", r: 4 }}
                    name="Total"
                  />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={{ fill: "var(--accent)", r: 4 }}
                    name="Sucesso"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Distribuição por Canal */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Distribuição por Canal</CardTitle>
              <CardDescription>Últimas 125 publicações</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart - Categorias Mais Ativas */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Categorias Mais Ativas</CardTitle>
            <CardDescription>Produtos publicados por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="category" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
