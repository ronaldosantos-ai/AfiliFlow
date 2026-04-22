import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, AlertCircle, Clock } from "lucide-react";

const mockPosts = [
  {
    id: 1,
    productName: "Fone de Ouvido Bluetooth Premium",
    price: 189.90,
    category: "Eletrônicos",
    imageUrl: "https://via.placeholder.com/300x300?text=Fone+Bluetooth",
    affiliateUrl: "https://shopee.com.br/product/123456",
    status: "published",
    publishedChannels: ["telegram", "instagram"],
    publishedAt: "2026-04-21T10:30:00Z",
  },
  {
    id: 2,
    productName: "Luminária LED Inteligente",
    price: 79.50,
    category: "Casa e Cozinha",
    imageUrl: "https://via.placeholder.com/300x300?text=Luminaria+LED",
    affiliateUrl: "https://shopee.com.br/product/234567",
    status: "published",
    publishedChannels: ["telegram", "instagram", "facebook"],
    publishedAt: "2026-04-21T09:15:00Z",
  },
  {
    id: 3,
    productName: "Tapete de Yoga Antiderrapante",
    price: 59.90,
    category: "Esportes",
    imageUrl: "https://via.placeholder.com/300x300?text=Tapete+Yoga",
    affiliateUrl: "https://shopee.com.br/product/345678",
    status: "published",
    publishedChannels: ["telegram"],
    publishedAt: "2026-04-21T08:00:00Z",
  },
  {
    id: 4,
    productName: "Sérum Facial Vitamina C",
    price: 45.00,
    category: "Beleza",
    imageUrl: "https://via.placeholder.com/300x300?text=Serum+Vitamina+C",
    affiliateUrl: "https://shopee.com.br/product/456789",
    status: "failed",
    publishedChannels: [],
    publishedAt: "2026-04-21T07:30:00Z",
    errorMessage: "Falha ao conectar com Instagram",
  },
  {
    id: 5,
    productName: "Carregador Rápido USB-C 65W",
    price: 129.90,
    category: "Eletrônicos",
    imageUrl: "https://via.placeholder.com/300x300?text=Carregador+USB-C",
    affiliateUrl: "https://shopee.com.br/product/567890",
    status: "pending",
    publishedChannels: [],
    publishedAt: "2026-04-21T06:45:00Z",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "published":
      return (
        <Badge className="bg-accent text-accent-foreground flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Publicado
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-destructive text-destructive-foreground flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Falha
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-muted text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pendente
        </Badge>
      );
    default:
      return null;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("pt-BR");
};

export default function Posts() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Postagens Recentes</h1>
            <p className="text-muted-foreground mt-1">Feed visual das últimas publicações</p>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPosts.map((post) => (
            <Card key={post.id} className="bg-card border-border overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative w-full h-48 bg-muted overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.productName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  {getStatusBadge(post.status)}
                </div>
              </div>

              {/* Content */}
              <CardContent className="pt-4">
                {/* Category Badge */}
                <Badge variant="outline" className="mb-2">
                  {post.category}
                </Badge>

                {/* Product Name */}
                <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                  {post.productName}
                </h3>

                {/* Price */}
                <div className="text-2xl font-bold text-accent mb-3">
                  R$ {post.price.toFixed(2)}
                </div>

                {/* Channels Published */}
                {post.publishedChannels.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Publicado em:</p>
                    <div className="flex flex-wrap gap-1">
                      {post.publishedChannels.map((channel) => (
                        <Badge key={channel} variant="secondary" className="text-xs">
                          {channel === "telegram" && "📱 Telegram"}
                          {channel === "instagram" && "📷 Instagram"}
                          {channel === "facebook" && "👍 Facebook"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {post.errorMessage && (
                  <div className="mb-3 p-2 bg-destructive/10 rounded text-xs text-destructive">
                    {post.errorMessage}
                  </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground mb-4">
                  {formatDate(post.publishedAt)}
                </p>

                {/* Affiliate Link Button */}
                <Button
                  asChild
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <a href={post.affiliateUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver Produto
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center">
          <Button variant="outline" className="border-border">
            Carregar Mais
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
