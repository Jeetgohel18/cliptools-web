import { SHOW_SOCIAL_LINK_TOOLS } from "./lib/features";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import MediaUpload from "./components/MediaUpload";
import PlatformCards from "./components/PlatformCards";
import HowItWorks from "./components/HowItWorks";
import CreativeAssets from "./components/CreativeAssets";
import Faq from "./components/Faq";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        {/* When social tools are hidden, the converter lives in the hero instead */}
        {SHOW_SOCIAL_LINK_TOOLS && <MediaUpload />}
        {SHOW_SOCIAL_LINK_TOOLS && <PlatformCards />}
        <HowItWorks />
        <CreativeAssets />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
