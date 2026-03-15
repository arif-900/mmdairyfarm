import Layout from "@/components/layout/Layout";
import { ArrowLeft, Truck, Clock, MapPin, PackageCheck, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Shipping = () => {
    const sections = [
        {
            icon: Clock,
            title: "Delivery Timelines",
            content: "To ensure you receive the freshest milk, we deliver early in the morning. Our standard delivery windows are:",
            list: [
                "Morning Slot: 5:00 AM - 8:00 AM (Daily)",
                "Same-day delivery for orders placed before 10 PM the previous night.",
                "One-time orders placed during the day will be delivered the following morning."
            ]
        },
        {
            icon: MapPin,
            title: "Shipping Areas",
            content: "Currently, MMVALI Farm delivers to major areas within and around Bhanakacherla and Bhanumukkala. We are constantly expanding our reach.",
            list: [
                "Bhanakacherla",
                "Bhanumukkala",
                "Localized regions within Kurnool district/Andhra Pradesh as specified during checkout."
            ]
        },
        {
            icon: Truck,
            title: "Shipping Charges",
            content: "We believe in transparent pricing. Shipping charges, if any, are calculated based on your location and the frequency of your subscription.",
            list: [
                "Standard Subscription: Free delivery included.",
                "One-time orders: Small delivery fee may apply below a certain order value.",
                "All charges will be clearly visible at the time of checkout."
            ]
        },
        {
            icon: PackageCheck,
            title: "Delivery Verification",
            content: "Our delivery partners will leave the package at your doorstep or with a security guard if instructed. We use insulated bags for certain products to maintain temperature.",
            list: null
        },
        {
            icon: AlertCircle,
            title: "Delayed Delivery",
            content: "While we strive for 100% on-time delivery, delays may occur due to extreme weather conditions, roadblocks, or other unforeseen circumstances. In such cases, we will inform you via SMS or Phone.",
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
                        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Shipping & Delivery Policy</h1>
                        <p className="text-primary-foreground/90 text-lg max-w-2xl">
                            Information about our delivery service, timelines, and areas.
                        </p>
                    </div>
                </div>
            </section>

            <section className="section-padding bg-muted/30">
                <div className="container-main max-w-5xl">
                    <div className="mb-12 bg-white dark:bg-slate-900 rounded-lg p-6 md:p-8 border border-border shadow-sm">
                        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                            We understand that dairy products are essential daily needs. Our logistics system is designed to provide reliable and hygienic delivery of fresh milk and dairy products directly from our farm to your home.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
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

export default Shipping;
