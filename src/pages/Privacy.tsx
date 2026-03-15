import Layout from "@/components/layout/Layout";
import { ArrowLeft, Lock, FileText, Shield, Users, Cookie, ExternalLink, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  const sections = [
    {
      icon: FileText,
      title: "Information We Collect",
      content: "We may collect personal information such as your name, phone number, email address, and delivery address when you contact us, place an order, or fill out a form on our website.",
      list: null
    },
    {
      icon: Lock,
      title: "Use of Information",
      content: "The information we collect is used only to:",
      list: [
        "Process and deliver your orders.",
        "Communicate order status, updates, or service-related information.",
        "Respond to your queries and support requests."
      ]
    },
    {
      icon: Shield,
      title: "Data Protection",
      content: "We take reasonable steps to protect your personal information from unauthorized access, misuse, or disclosure. However, no online transmission or storage system can be guaranteed to be 100% secure.",
      list: null
    },
    {
      icon: Users,
      title: "Sharing of Information",
      content: "MMVALI Farm does not sell, trade, or rent your personal data to third parties. We may share information only when required by law or to comply with legal obligations.",
      list: null
    },
    {
      icon: Cookie,
      title: "Cookies & Tracking",
      content: "Our website may use basic cookies to improve user experience and understand general usage patterns. You can manage or disable cookies through your browser settings.",
      list: null
    },
    {
      icon: ExternalLink,
      title: "Third-Party Links",
      content: "Our website may contain links to external sites. We are not responsible for the content or privacy practices of third-party websites.",
      list: null
    },
    {
      icon: Clock,
      title: "Policy Updates",
      content: "This privacy policy may be updated from time to time. Any changes will be posted on this page, and your continued use of our services will be deemed as acceptance of the updated policy.",
      list: null
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
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-primary-foreground/90 text-lg max-w-2xl">
              Your privacy matters to us. Learn how we protect your personal information.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/30">
        <div className="container-main max-w-5xl">
          <div className="mb-12 bg-white dark:bg-slate-900 rounded-lg p-6 md:p-8 border border-border shadow-sm">
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              MMVALI Farm respects your privacy and is committed to protecting your personal information. This policy explains how we collect, use, and safeguard your data when you interact with us.
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
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                      {section.content}
                    </p>
                    {section.list && (
                      <ul className="space-y-2">
                        {section.list.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-3">
                            <span className="text-primary mt-1.5">•</span>
                            <span className="text-sm md:text-base text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
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

export default Privacy;