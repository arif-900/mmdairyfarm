import Layout from "@/components/layout/Layout";
import { ArrowLeft, Package, CreditCard, Truck, User, Globe, AlertCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  const sections = [
    {
      icon: Package,
      title: "Product Availability",
      content: "All dairy products listed on this website are subject to availability. Availability may vary due to seasonal factors, production capacity, or unforeseen circumstances. We reserve the right to limit quantities or discontinue products at any time."
    },
    {
      icon: CreditCard,
      title: "Pricing & Payments",
      content: "Prices displayed on the website are subject to change without prior notice. Any confirmed order will be charged at the price applicable at the time of confirmation. Payment terms, if any, will be communicated during order placement."
    },
    {
      icon: Truck,
      title: "Orders & Delivery",
      content: "Orders are considered confirmed only after acceptance by MMVALI Farm. Delivery timelines may vary depending on location, weather, and availability. We will make reasonable efforts to deliver within the communicated time frame."
    },
    {
      icon: User,
      title: "User Responsibilities",
      content: "You are responsible for providing accurate contact and delivery details. MMVALI Farm is not responsible for delays, failed deliveries, or losses arising due to incorrect or incomplete information shared by you."
    },
    {
      icon: Globe,
      title: "Website Usage",
      content: "The content on this website is for general information purposes only. Unauthorized use, copying, or reproduction of content, images, or branding is strictly prohibited without prior written consent from MMVALI Farm."
    },
    {
      icon: AlertCircle,
      title: "Limitation of Liability",
      content: "While we strive to maintain quality and accuracy, MMVALI Farm is not liable for any indirect, incidental, or consequential damages arising from the use of our products or website."
    },
    {
      icon: RefreshCw,
      title: "Changes to Terms",
      content: "MMVALI Farm reserves the right to update or modify these terms at any time without prior notice. Continued use of the website or services implies acceptance of the updated terms."
    }
  ];

  return (
    <Layout>
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground section-padding">
        <div className="container-main">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
            <p className="text-primary-foreground/90 text-lg max-w-2xl">
              Please read our terms and conditions carefully before using our services.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/30">
        <div className="container-main max-w-5xl">
          <div className="mb-12 bg-white dark:bg-slate-900 rounded-lg p-6 md:p-8 border border-border shadow-sm">
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Welcome to MMVALI Farm. By accessing or using our website and services, you agree to follow the terms and conditions outlined below. Please read them carefully before using our services.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Terms;