
import React from 'react';
import { ChevronRight, TrendingUp, ShieldCheck, Smartphone, Landmark, Briefcase, BrainCircuit } from 'lucide-react';

const MarketTicker: React.FC = () => {
    const stocks = [
        { name: "S&P 500", value: "5,477.90", change: "+21.43 (0.39%)", positive: true },
        { name: "NASDAQ", value: "17,857.02", change: "+167.65 (0.95%)", positive: true },
        { name: "DOW JONES", value: "39,150.33", change: "-299.05 (0.76%)", positive: false },
        { name: "RUSSELL 2000", value: "2,022.03", change: "-3.98 (0.20%)", positive: false },
        { name: "BTC/USD", value: "64,132.50", change: "+850.20 (1.34%)", positive: true },
    ];
    return (
        <div className="bg-westcoast-dark text-white overflow-hidden whitespace-nowrap">
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

const HeroSection: React.FC = () => (
    <div className="relative bg-westcoast-dark text-white">
        <div className="container mx-auto px-4 flex items-center min-h-[500px]">
            <div className="w-full md:w-1/2 text-left z-10">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight">Your Financial Future, Elevated.</h1>
                <p className="text-md sm:text-lg text-gray-300 mb-8">Seamless banking meets powerful investing. Grow your wealth with confidence on a platform built for you.</p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <button className="bg-westcoast-accent text-westcoast-dark font-bold py-3 px-8 rounded-full hover:opacity-90 transition-opacity">
                        Open an Account
                    </button>
                    <button className="bg-white/20 text-white font-bold py-3 px-8 rounded-full hover:bg-white/30 transition-colors">
                        Explore Investing
                    </button>
                </div>
            </div>
        </div>
        <div className="absolute inset-0 z-0 opacity-30">
             <img src="https://images.unsplash.com/photo-1664092041235-8656810a4d44?q=80&w=2832&auto=format&fit=crop" alt="Abstract financial graphics" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-r from-westcoast-dark via-westcoast-dark/80 to-transparent"></div>
        </div>
    </div>
);

const FeaturesSection: React.FC = () => {
    const features = [
        { icon: <Landmark size={28} className="text-westcoast-blue" />, title: 'Smart Banking', description: 'Effortless payments, advanced budgeting, and global support, all in one place.' },
        { icon: <TrendingUp size={28} className="text-westcoast-blue" />, title: 'Powerful Investing', description: 'Trade stocks, ETFs, and explore managed portfolios with low fees and expert insights.' },
        { icon: <ShieldCheck size={28} className="text-westcoast-blue" />, title: 'Total Security', description: 'Your assets are protected with bank-grade security and FDIC insurance.' },
    ];
    return (
        <div className="bg-white py-20">
            <div className="container mx-auto px-4 text-center">
                 <div className="grid md:grid-cols-3 gap-12">
                     {features.map(feature => (
                        <div key={feature.title} className="text-left">
                            <div className="mb-4">{feature.icon}</div>
                            <h3 className="text-2xl font-bold text-westcoast-text-dark mb-2">{feature.title}</h3>
                            <p className="text-westcoast-text-light">{feature.description}</p>
                        </div>
                     ))}
                 </div>
            </div>
        </div>
    );
};


const ProductsSection: React.FC = () => {
    const products = [
        { title: 'Personal Checking', description: 'No monthly fees, free ATM withdrawals, and a debit card that works worldwide.', icon: <Landmark /> },
        { title: 'Stock & ETF Trading', description: 'Invest in thousands of stocks and ETFs, commission-free. Start with as little as $1.', icon: <Briefcase /> },
        { title: 'Managed Portfolios', description: 'Let our experts build and manage a diversified portfolio tailored to your financial goals.', icon: <BrainCircuit /> },
        { title: 'High-Yield Savings', description: 'Earn a competitive interest rate on your savings and watch your money grow faster.', icon: <Smartphone /> },
    ];
    return (
        <div className="bg-westcoast-bg py-20">
            <div className="container mx-auto px-4">
                 <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="text-4xl font-bold text-westcoast-text-dark mb-4">One Platform, Every Financial Need</h2>
                    <p className="text-lg text-westcoast-text-light">From daily spending to long-term investing, our integrated products are designed to work together seamlessly.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {products.map(product => (
                        <div key={product.title} className="bg-white p-8 rounded-xl shadow-md flex items-start space-x-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                             <div className="bg-westcoast-blue/10 p-3 rounded-lg text-westcoast-blue">{product.icon}</div>
                            <div>
                                <h3 className="text-xl font-bold text-westcoast-text-dark mb-2">{product.title}</h3>
                                <p className="text-westcoast-text-light mb-4">{product.description}</p>
                                <a href="#" className="font-bold text-westcoast-blue hover:underline flex items-center">
                                    Learn More <ChevronRight size={16} className="ml-1" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const FinalCTASection: React.FC = () => (
    <div className="bg-white py-20">
        <div className="container mx-auto px-4">
            <div className="bg-westcoast-dark text-white rounded-xl shadow-lg text-center p-8 md:p-12 relative overflow-hidden">
                <div className="absolute -top-16 -left-16 w-48 h-48 bg-westcoast-blue/20 rounded-full"></div>
                <div className="absolute -bottom-24 -right-16 w-64 h-64 bg-westcoast-accent/20 rounded-full"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to build your wealth?</h2>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">Join thousands of users who trust Westcoast to manage their banking and investments. Sign up in minutes.</p>
                    <button className="bg-westcoast-accent text-westcoast-dark font-bold py-3 px-8 rounded-full hover:opacity-90 transition-opacity text-lg">
                        Get Started Today
                    </button>
                </div>
            </div>
        </div>
    </div>
);


const HomePage: React.FC = () => {
    return (
        <>
            <HeroSection />
            <MarketTicker />
            <FeaturesSection />
            <ProductsSection />
            <FinalCTASection />
        </>
    );
};

export default HomePage;