import Layout from "@/components/layout/Layout";
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: "What is the source of your milk?",
            answer: "All our milk comes directly from our owned and managed MMVALI Dairy Farm located in Bhanakacherla. We ensure the cattle are healthy, well-fed, and the milking process is hygienic."
        },
        {
            question: "Is the milk pasteurized or raw?",
            answer: "We offer both options depending on customer preference. Our standard delivery is fresh, chilled milk. We maintain a strict cold chain to ensure quality without heavy processing."
        },
        {
            question: "What are your delivery timings?",
            answer: "We deliver every morning between 5:00 AM and 8:00 AM. This ensures you have fresh milk ready for your morning tea, coffee, or breakfast."
        },
        {
            question: "How do I manage my subscription?",
            answer: "You can manage your subscription through the 'My Orders' section after logging in. You can pause, resume, or change the quantity of your daily delivery."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept all major credit/debit cards, UPI (PhonePe, Google Pay), and Net Banking through our secure payment partner, Razorpay."
        },
        {
            question: "Is there a minimum order for delivery?",
            answer: "For subscriptions, there is a minimum requirement of 500ml per day. For one-time product orders (Ghee, Paneer), a small delivery fee may apply for orders below ₹300."
        },
        {
            question: "How do I cancel an order or request a refund?",
            answer: "Cancellations can be made through the app 12 hours before delivery. For quality issues, please refer to our Refund Policy and contact us within 2 hours of delivery for fresh milk."
        }
    ];

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

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
                        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
                        <p className="text-primary-foreground/90 text-lg max-w-2xl">
                            Find answers to common questions about our products, delivery, and services.
                        </p>
                    </div>
                </div>
            </section>

            <section className="section-padding bg-muted/30">
                <div className="container-main max-w-3xl">
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <Card key={index} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full text-left p-6 flex items-center justify-between gap-4 focus:outline-none"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                                            <HelpCircle className="w-5 h-5 text-primary" />
                                        </div>
                                        <span className="font-semibold text-lg">{faq.question}</span>
                                    </div>
                                    {openIndex === index ? (
                                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </button>
                                {openIndex === index && (
                                    <CardContent className="pb-6 px-6 pt-0 ml-14">
                                        <p className="text-muted-foreground leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-muted-foreground mb-4">Still have questions?</p>
                        <Link to="/contact">
                            <Button size="lg">Contact Support</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default FAQ;
