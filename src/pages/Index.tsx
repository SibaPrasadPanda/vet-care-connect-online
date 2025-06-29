import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PawPrint, Clock, Users, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user } = useAuth();
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="vet-accent-gradient text-white py-20">
        <div className="container px-4 text-center">
          <PawPrint className="inline-block h-14 w-14 mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Quality Veterinary Care From Anywhere
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Connect with licensed veterinarians for expert advice, consultations, and care for your beloved pets
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {!user ? (
              <>
                <Button asChild size="lg" variant="default" className="bg-white text-vet-primary hover:bg-gray-100">
                  <Link to="/register">Register Now</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-vet-primary">
                  <Link to="/login">Login</Link>
                </Button>
              </>
            ) : (
              <Button asChild size="lg" variant="default" className="bg-white text-vet-primary hover:bg-gray-100">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-accent">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-vet-primary rounded-full p-4 mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-medium mb-2">Sign Up</h3>
              <p className="text-muted-foreground">Create your account as a pet owner, veterinarian, or field agent</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-vet-primary rounded-full p-4 mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-medium mb-2">Schedule Consultation</h3>
              <p className="text-muted-foreground">Book an appointment or request emergency consultation</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-vet-primary rounded-full p-4 mb-4">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-medium mb-2">Get Care</h3>
              <p className="text-muted-foreground">Receive diagnosis, prescription, and follow-up care all online</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Our Services</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Comprehensive veterinary care through our telemedicine platform
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Video Consultations",
                description: "Connect with licensed veterinarians via video call for real-time advice and diagnosis"
              },
              {
                title: "Field Agent Visits",
                description: "Schedule a visit from our trained field agents for physical examination and sample collection"
              },
              {
                title: "Digital Prescriptions",
                description: "Receive digital prescriptions for medications and treatment plans"
              },
              {
                title: "Emergency Support",
                description: "24/7 emergency consultation support for urgent pet health concerns"
              },
              {
                title: "Follow-up Care",
                description: "Scheduled follow-up appointments to monitor your pet's progress"
              },
              {
                title: "Medical Records",
                description: "Secure storage and access to your pet's complete medical history"
              }
            ].map((service, index) => (
              <Card key={index} className="vet-card-gradient border-none">
                <CardContent className="p-6">
                  <h3 className="text-xl font-medium mb-2">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-accent">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Pet Owners Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "The field agent visit saved us a stressful trip to the clinic. Our cat hates traveling, so this was perfect!",
                author: "Sarah M.",
                pet: "Cat Owner"
              },
              {
                quote: "Got quick advice for my dog's skin condition. The vet was professional and the prescription worked great.",
                author: "Michael T.",
                pet: "Dog Owner"
              },
              {
                quote: "As someone living in a rural area, this service has been a game-changer for getting quality care for my horses.",
                author: "Linda K.",
                pet: "Horse Owner"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-background p-6 rounded-lg shadow">
                <p className="italic mb-4">{testimonial.quote}</p>
                <div className="font-medium">{testimonial.author}</div>
                <div className="text-sm text-muted-foreground">{testimonial.pet}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 vet-accent-gradient text-white text-center">
        <div className="container px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of pet owners already using VetCare Connect for their pets' healthcare needs
          </p>
          {!user ? (
            <Button asChild size="lg" variant="default" className="bg-white text-vet-primary hover:bg-gray-100">
              <Link to="/register">Register Now</Link>
            </Button>
          ) : (
            <Button asChild size="lg" variant="default" className="bg-white text-vet-primary hover:bg-gray-100">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Index;