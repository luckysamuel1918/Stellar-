import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft, TrendingUp, ShieldCheck, Smartphone, Landmark, Briefcase, BrainCircuit, Loader2, Newspaper, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { GoogleGenAI } from "@google/genai";

const PLACEHOLDER_IMAGE_URI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOWNhM2FmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiIGZpbGw9IiNlNWU3ZWIiPjwvcmVjdD48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSIgZmlsbD0iIzljYTNhZiIgc3Ryb2tlPSJub25lIj48L2NpcmNsZT48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIiBmaWxsPSJub25lIj48L3BvbHlsaW5lPjwvc3ZnPg==';

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = PLACEHOLDER_IMAGE_URI;
    e.currentTarget.onerror = null; // Prevent infinite loop
};

const heroSlides = [
    {
        url: 'https://images.unsplash.com/photo-1600985160351-a9c6560965ea?q=80&w=2070&auto=format&fit=crop',
        alt: 'Abstract financial graphics',
    },
    {
        url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2072&auto=format&fit=crop',
        alt: 'Person analyzing financial data on a laptop',
    },
    {
        url: 'https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?q=80&w=2070&auto=format&fit=crop',
        alt: 'Futuristic abstract data visualization',
    },
];

const MarketTicker: React.FC = () => {
    const stocks = [
        { name: "S&P 500", value: "5,477.90", change: "+21.43 (0.39%)", positive: true },
        { name: "NASDAQ", value: "17,857.02", change: "+167.65 (0.95%)", positive: true },
        { name: "DOW JONES", value: "39,150.33", change: "-299.05 (0.76%)", positive: false },
        { name: "RUSSELL 2000", value: "2,022.03", change: "-3.98 (0.20%)", positive: false },
        { name: "BTC/USD", value: "64,132.50", change: "+850.20 (1.34%)", positive: true },
    ];
    return (
        <div className="bg-westcoast-dark dark:bg-black text-white overflow-hidden whitespace-nowrap">
            <div className="py-2 animate-marquee inline-block">
                {stocks.concat(stocks).map((stock, index) => (
                    <div key={index} className="inline-flex items-center mx-4 text-sm">
                        <span className="text-gray-400 mr-2">{stock.name}</span>
                        <span className="font-medium mr-2">{stock.value}</span>
                        <span className={stock.positive ? 'text-green-400' : 'text-red-400'}>{stock.change}</span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}</style>
        </div>
    );
};

const HeroSection: React.FC = () => {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imagesLoaded, setImagesLoaded] = useState<boolean[]>(Array(heroSlides.length).fill(false));
    const slides = heroSlides;

    useEffect(() => {
        const imagePromises = slides.map((slide, index) => {
            return new Promise<void>((resolve) => {
                const img = new Image();
                img.src = slide.url;
                img.onload = () => {
                    setImagesLoaded(prevLoaded => {
                        const newLoaded = [...prevLoaded];
                        newLoaded[index] = true;
                        return newLoaded;
                    });
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to load hero image: ${slide.url}`);
                    // Mark as "loaded" to remove skeleton, onError on img tag will show the placeholder
                    setImagesLoaded(prevLoaded => {
                        const newLoaded = [...prevLoaded];
                        newLoaded[index] = true;
                        return newLoaded;
                    });
                    resolve();
                };
            });
        });
        Promise.all(imagePromises);
    }, [slides]);

    const prevSlide = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const nextSlide = useCallback(() => {
        const isLastSlide = currentIndex === slides.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    }, [currentIndex, slides.length]);
    
    useEffect(() => {
        const slideInterval = setInterval(nextSlide, 7000); // slow motion swipe every 7 seconds
        return () => clearInterval(slideInterval);
    }, [nextSlide]);

    return (
        <div className="relative bg-westcoast-dark dark:bg-black text-white h-[500px] overflow-hidden">
            {/* Image Slider Container */}
            <div className="absolute inset-0 z-0">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-30 dark:opacity-40' : 'opacity-0'}`}
                    >
                         {/* Skeleton loader shown if image isn't loaded yet */}
                        {!imagesLoaded[index] && <div className="absolute inset-0 bg-gray-800 animate-pulse"></div>}

                         <img 
                            src={slide.url} 
                            alt={slide.alt} 
                            className={`w-full h-full object-cover transition-opacity duration-500 ${imagesLoaded[index] ? 'opacity-100' : 'opacity-0'}`}
                            onError={handleImageError} 
                         />
                         <div className="absolute inset-0 bg-gradient-to-r from-westcoast-dark dark:from-black via-westcoast-dark/80 dark:via-black/80 to-transparent"></div>
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 flex items-center h-full relative z-10">
                <div className="w-full md:w-1/2 text-left">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight">Your Financial Future, Elevated.</h1>
                    <p className="text-md sm:text-lg text-gray-300 dark:text-gray-400 mb-8">Seamless banking meets powerful investing. Grow your wealth with confidence on a platform built for you.</p>
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <button onClick={() => navigate('/user?action=signup')} className="bg-westcoast-accent text-westcoast-dark font-bold py-3 px-8 rounded-full hover:opacity-90 transition-opacity">
                            Open an Account
                        </button>
                        <button onClick={() => navigate('/user?action=signup')} className="bg-white/20 text-white font-bold py-3 px-8 rounded-full hover:bg-white/30 transition-colors">
                            Explore Investing
                        </button>
                    </div>
                </div>
            </div>
            
             {/* Manual Controls */}
            <div className="absolute z-20 bottom-5 left-1/2 -translate-x-1/2 flex space-x-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`Go to slide ${index + 1}`}
                        className={`w-3 h-3 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}
                    />
                ))}
            </div>

            <button onClick={prevSlide} aria-label="Previous slide" className="absolute top-1/2 left-4 -translate-y-1/2 z-20 bg-black/30 p-2 rounded-full text-white hover:bg-black/50 transition-colors hidden md:block">
                <ChevronLeft size={24} />
            </button>
            <button onClick={nextSlide} aria-label="Next slide" className="absolute top-1/2 right-4 -translate-y-1/2 z-20 bg-black/30 p-2 rounded-full text-white hover:bg-black/50 transition-colors hidden md:block">
                <ChevronRight size={24} />
            </button>
        </div>
    );
};

const FeaturesSection: React.FC = () => {
    const features = [
        { 
            icon: <Landmark size={28} className="text-westcoast-blue" />, 
            title: "Smart Banking", 
            description: "Effortless payments, advanced budgeting, and global support, all in one place.",
            imgSrc: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop'
        },
        { 
            icon: <TrendingUp size={28} className="text-westcoast-blue" />, 
            title: "Powerful Investing", 
            description: "Trade stocks, ETFs, and explore managed portfolios with low fees and expert insights.",
            imgSrc: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070&auto=format&fit=crop'
        },
        { 
            icon: <ShieldCheck size={28} className="text-westcoast-blue" />, 
            title: "Total Security", 
            description: "Your assets are protected with bank-grade security and FDIC insurance.",
            imgSrc: 'https://images.unsplash.com/photo-1614064548237-02f15507b341?q=80&w=2070&auto=format&fit=crop'
        },
    ];
    return (
        <div className="bg-white dark:bg-gray-800 py-20">
            <div className="container mx-auto px-4">
                 <div className="grid md:grid-cols-3 gap-8">
                     {features.map(feature => (
                        <div key={feature.title} className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
                            <img src={feature.imgSrc} alt={feature.title} className="w-full h-48 object-cover" onError={handleImageError}/>
                            <div className="p-6">
                                <div className="mb-4">{feature.icon}</div>
                                <h3 className="text-2xl font-bold text-westcoast-text-dark dark:text-white mb-2">{feature.title}</h3>
                                <p className="text-westcoast-text-light dark:text-gray-300">{feature.description}</p>
                            </div>
                        </div>
                     ))}
                 </div>
            </div>
        </div>
    );
};


const ProductsSection: React.FC = () => {
    const navigate = useNavigate();
    const products = [
        { title: "Personal Checking", description: "No monthly fees, free ATM withdrawals, and a debit card that works worldwide.", icon: <Landmark />, imgSrc: 'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?q=80&w=2070&auto=format&fit=crop' },
        { title: "Stock & ETF Trading", description: "Invest in thousands of stocks and ETFs, commission-free. Start with as little as $1.", icon: <Briefcase />, imgSrc: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop' },
        { title: "Managed Portfolios", description: "Let our experts build and manage a diversified portfolio tailored to your financial goals.", icon: <BrainCircuit />, imgSrc: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070&auto=format&fit=crop' },
        { title: "High-Yield Savings", description: "Earn a competitive interest rate on your savings and watch your money grow faster.", icon: <Smartphone />, imgSrc: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=1932&auto=format&fit=crop' },
    ];
    return (
        <div className="bg-westcoast-bg dark:bg-gray-900 py-20">
            <div className="container mx-auto px-4">
                 <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-westcoast-text-dark dark:text-white mb-4">One Platform, Every Financial Need</h2>
                    <p className="text-lg text-westcoast-text-light dark:text-gray-300 max-w-3xl mx-auto">From daily spending to long-term investing, our integrated products are designed to work together seamlessly.</p>
                 </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map(product => (
                        <div key={product.title} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col">
                            <img src={product.imgSrc} alt={product.title} className="w-full h-40 object-cover" onError={handleImageError} />
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-westcoast-blue/10 p-3 rounded-lg text-westcoast-blue flex-shrink-0 mt-1">{product.icon}</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-westcoast-text-dark dark:text-white mb-2">{product.title}</h3>
                                        <p className="text-sm text-westcoast-text-light dark:text-gray-300">{product.description}</p>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4">
                                     <button onClick={() => navigate('/user?action=signup')} className="font-bold text-westcoast-blue hover:underline flex items-center text-sm">
                                        Learn More <ChevronRight size={16} className="ml-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const MarketInsightsSection: React.FC = () => {
    const [news, setNews] = useState<{ headline: string; summary: string }[]>([]);
    const [sources, setSources] = useState<{ uri: string; title: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const parseNews = (text: string) => {
        if (!text) return [];
        const articles = [];
        const entries = text.split('Headline:').slice(1);
        for (const entry of entries) {
            const parts = entry.split('Summary:');
            if (parts.length === 2) {
                articles.push({
                    headline: parts[0].trim(),
                    summary: parts[1].trim(),
                });
            }
        }
        return articles;
    };

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: "Get the top 5 latest financial news headlines. For each headline, provide a brief 1-2 sentence summary. Format each item like this: Headline: [The headline] Summary: [The summary]",
                    config: {
                        tools: [{ googleSearch: {} }],
                    },
                });

                const text = response.text;
                const parsedNews = parseNews(text);
                setNews(parsedNews);

                const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (groundingChunks) {
                    const webSources = groundingChunks
                        .filter(chunk => chunk.web)
                        .map(chunk => chunk.web)
                        .filter((value, index, self) => self.findIndex(s => s.uri === value.uri) === index);
                    setSources(webSources);
                }
            } catch (err) {
                console.error("Error fetching market news:", err);
                setError("Could not load market insights at this time.");
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    const renderSkeletons = () => (
        Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
        ))
    );

    return (
        <div className="bg-white dark:bg-gray-800 py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-westcoast-text-dark dark:text-white mb-4">Market Insights</h2>
                    <p className="text-lg text-westcoast-text-light dark:text-gray-300 max-w-3xl mx-auto">Stay informed with the latest financial news and updates, powered by real-time search.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? renderSkeletons() : error ? (
                        <div className="col-span-full text-center text-red-500 bg-red-50 dark:bg-red-900/40 p-6 rounded-lg">{error}</div>
                    ) : (
                        news.map((item, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow-md p-6 flex flex-col">
                                <div className="flex-grow">
                                    <h3 className="text-lg font-bold text-westcoast-text-dark dark:text-white mb-2">{item.headline}</h3>
                                    <p className="text-sm text-westcoast-text-light dark:text-gray-300">{item.summary}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {sources.length > 0 && (
                    <div className="mt-12">
                        <h4 className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Information Sources</h4>
                        <div className="flex flex-wrap justify-center gap-4">
                            {sources.map((source, index) => (
                                <a key={index} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-westcoast-blue hover:underline flex items-center gap-1">
                                    {source.title} <ExternalLink size={14} />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const TeamSection: React.FC = () => {
    const staffData = [
        { name: 'Dr. Evelyn Reed', title: 'Chief Executive Officer', description: 'With over 20 years in finance, Evelyn guides our strategic vision, ensuring sustainable growth and innovation while fostering a customer-centric culture.', imgSrc: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&h=200&auto=format&fit=crop&ixlib=rb-4.0.3' },
        { name: 'Benjamin Carter', title: 'Chief Financial Officer', description: 'Ben oversees all financial operations, leveraging data-driven insights to maintain our fiscal health, manage risk, and drive shareholder value.', imgSrc: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=200&h=200&auto=format&fit=crop&ixlib=rb-4.0.3' },
        { name: 'Olivia Martinez', title: 'Head of Investment Strategy', description: 'Olivia leads our investment team, crafting bespoke portfolios that help clients navigate complex markets and achieve their long-term wealth goals.', imgSrc: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=200&h=200&auto=format&fit=crop&ixlib=rb-4.0.3' },
        { name: 'Samuel Chen', title: 'Chief Technology Officer', description: 'Samuel drives our digital transformation. He focuses on building the secure and intuitive platform our customers rely on for seamless banking.', imgSrc: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=200&h=200&auto=format&fit=crop&ixlib=rb-4.0.3' },
        { name: 'Aisha Khan', title: 'Head of Personal Banking', description: 'Aisha is dedicated to providing exceptional customer service and tailored banking solutions for individuals and families, making banking simple and personal.', imgSrc: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&h=200&auto=format&fit=crop&ixlib=rb-4.0.3' },
        { name: 'Marcus Holloway', title: 'Director of Compliance', description: 'Marcus ensures our operations adhere to the highest standards of regulatory compliance and security, safeguarding our clients and the institution.', imgSrc: 'https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?q=80&w=200&h=200&auto=format&fit=crop&ixlib=rb-4.0.3' }
    ];
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const isInitialMount = useRef(true);

    useEffect(() => {
        itemRefs.current = itemRefs.current.slice(0, staffData.length);
    }, [staffData.length]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const nextIndex = (currentIndex + 1) % staffData.length;
            setCurrentIndex(nextIndex);
        }, 6000); // Auto-swipe every 6 seconds
        return () => clearTimeout(timer);
    }, [currentIndex, staffData.length]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const container = scrollContainerRef.current;
        const card = itemRefs.current[currentIndex];

        if (container && card) {
            const scrollLeft = card.offsetLeft - container.offsetLeft;
            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth',
            });
        }
    }, [currentIndex]);
    
    const scroll = (direction: 'left' | 'right') => {
        let nextIndex;
        if (direction === 'left') {
            nextIndex = (currentIndex - 1 + staffData.length) % staffData.length;
        } else {
            nextIndex = (currentIndex + 1) % staffData.length;
        }
        setCurrentIndex(nextIndex);
    };

    const StaffCard: React.FC<{ staff: typeof staffData[0], cardRef: (el: HTMLDivElement | null) => void }> = ({ staff, cardRef }) => (
        <div ref={cardRef} className="snap-start flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-full flex flex-col items-center text-center hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <img src={staff.imgSrc} alt={staff.name} onError={handleImageError} className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-white dark:border-gray-700 shadow-md" />
                <h3 className="text-xl font-bold text-westcoast-text-dark dark:text-white">{staff.name}</h3>
                <p className="italic text-westcoast-blue dark:text-westcoast-accent my-1">{staff.title}</p>
                <p className="text-sm text-westcoast-text-light dark:text-gray-300 mt-2 flex-grow">{staff.description}</p>
            </div>
        </div>
    );

    return (
        <div className="bg-westcoast-bg dark:bg-gray-900 py-20">
            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <div className="container mx-auto px-4">
                 <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-westcoast-text-dark dark:text-white mb-4">Meet Our Team</h2>
                    <p className="text-lg text-westcoast-text-light dark:text-gray-300 max-w-3xl mx-auto">The driving force behind your financial success. Our experts are dedicated to providing you with unparalleled service and guidance.</p>
                 </div>
                 <div className="relative">
                     <div ref={scrollContainerRef} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide -m-4 p-4">
                        {staffData.map((staff, index) => (
                            <StaffCard key={index} staff={staff} cardRef={el => itemRefs.current[index] = el} />
                        ))}
                    </div>
                    <button onClick={() => scroll('left')} aria-label="Previous" className="absolute top-1/2 -left-4 -translate-y-1/2 bg-white/80 dark:bg-black/80 p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-black transition z-10 hidden md:block">
                        <ChevronLeft className="h-6 w-6 text-westcoast-dark dark:text-white" />
                    </button>
                    <button onClick={() => scroll('right')} aria-label="Next" className="absolute top-1/2 -right-4 -translate-y-1/2 bg-white/80 dark:bg-black/80 p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-black transition z-10 hidden md:block">
                        <ChevronRight className="h-6 w-6 text-westcoast-dark dark:text-white" />
                    </button>
                 </div>
            </div>
        </div>
    );
};


const FinalCTASection: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="bg-westcoast-bg dark:bg-gray-900 py-20">
            <div className="container mx-auto px-4">
                <div 
                    className="text-white rounded-xl shadow-lg text-center p-8 md:p-12 relative overflow-hidden"
                >
                    <img
                        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                        onError={handleImageError}
                        alt="Team working together"
                        className="absolute inset-0 w-full h-full object-cover"
                        aria-hidden="true"
                    />
                    <div className="absolute inset-0 bg-westcoast-dark/70 dark:bg-black/70 backdrop-blur-sm"></div>
                    <div className="absolute -top-16 -left-16 w-48 h-48 bg-westcoast-blue/20 rounded-full"></div>
                    <div className="absolute -bottom-24 -right-16 w-64 h-64 bg-westcoast-accent/20 rounded-full"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to build your wealth?</h2>
                        <p className="text-lg text-gray-200 max-w-2xl mx-auto mb-8">Join thousands of users who trust Westcoast to manage their banking and investments. Sign up in minutes.</p>
                        <button onClick={() => navigate('/user?action=signup')} className="bg-westcoast-accent text-westcoast-dark font-bold py-3 px-8 rounded-full hover:opacity-90 transition-opacity text-lg">
                            Get Started Today
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const HomePage: React.FC = () => {
    const { userData, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // If the user is logged in, redirect them
        if (!loading && userData) {
            if (userData.isAdmin) {
                navigate('/admin-dashboard', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [userData, loading, navigate]);

    // Prevent rendering the homepage for logged in users while redirecting
    if (loading || userData) {
        return (
            <div className="flex justify-center items-center h-screen bg-westcoast-bg dark:bg-gray-900">
                <Loader2 className="w-10 h-10 animate-spin text-westcoast-blue"/>
            </div>
        );
    }

    return (
        <>
            <HeroSection />
            <MarketTicker />
            <FeaturesSection />
            <ProductsSection />
            <MarketInsightsSection />
            <TeamSection />
            <FinalCTASection />
        </>
    );
};

export default HomePage;
