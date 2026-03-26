import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

type DashboardTheme = 'light' | 'dark';

type IndustryCard = {
	label: string;
};

type TemplatesTabContentProps = {
	/**
	 * Tab theme mode used to render color variants.
	 */
	theme: DashboardTheme;
	/**
	 * Industries displayed in the browse-by-industry grid.
	 */
	industries: readonly IndustryCard[];
	/**
	 * Returns the icon node for a given industry label.
	 */
	getIndustryIcon: (label: string) => ReactNode;
};

/**
 * Renders all content for the "TEMPLATES" dashboard tab.
 */
export function TemplatesTabContent({
	theme,
	industries,
	getIndustryIcon,
}: TemplatesTabContentProps) {
	return (
		<motion.div
			key="templates-tab"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -8 }}
			transition={{ duration: 0.22, ease: 'easeOut' }}
		>
			<section className="mx-auto w-full max-w-none pt-2 my-10">
				<div className="mb-5 flex items-center justify-between">
					<h3
						className={`
							uppercase text-xs sm:text-sm font-bold tracking-[0.18em] transition-colors duration-300
							${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#8B5CF6]'}
						`}
					>
						Browse by Industry
					</h3>
				</div>
                
                {/* Browse by industries grid */}
				<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
					{industries.map((industry) => {
                        const activeIcon = getIndustryIcon(industry.label);

                        return (
                            <button
                                key={industry.label}
                                type="button"
                                className={`
                                    group relative h-25 sm:h-27.5 w-full overflow-hidden rounded-[32px] border transition-all duration-500 text-left
                                    ${theme === 'dark'
                                        ? 'border-[#272261]/50 bg-[#23164E] hover:border-[#B13BFF] hover:bg-[#2A1756]'
                                        // --- LIGHT MODE: SUBTLE LAVENDER WASH ---
                                        : 'border-[#7C3AED]/10 bg-[#F8F7FF] hover:border-[#7C3AED]/30 hover:bg-[#F3F0FF] shadow-[0_10px_30px_-10px_rgba(124,58,237,0.08)]'
                                    }
                                    hover:-translate-y-1 active:scale-[0.98]
                                `}
                            >
                                <div
                                    className={`
                                        absolute -right-6 -top-10 h-[150%] w-[68%] rounded-full transition-all duration-700 group-hover:scale-110
                                        ${theme === 'dark' 
                                            ? 'bg-[#1A0D45]' 
                                            : 'bg-gradient-to-br from-[#7C3AED]/20 via-[#A855F7]/40 to-[#F43F5E]/20 blur-xl opacity-80 group-hover:opacity-100'
                                        }
                                    `}
                                />

                                <div className="relative z-10 flex h-full w-full items-center px-6 sm:px-9">
                                    <span
                                        className={`
                                            flex-1 text-sm sm:text-base font-[1000] leading-snug tracking-tighter transition-all duration-300 pr-14 sm:pr-20
                                            ${theme === 'dark'
                                                ? 'text-white group-hover:text-white/90'
                                                // --- LIGHT MODE: DEEP PLUM-INDIGO TO ELECTRIC PURPLE ---
                                                : 'text-[#2E1065] group-hover:text-[#7C3AED]'
                                            }
                                        `}
                                    >
                                        {industry.label}
                                    </span>

                                    <div className="absolute right-4 sm:right-6 flex items-center justify-center">
                                        <div
                                            className={`
                                                relative flex h-14 w-14 items-center justify-center rounded-[24px] border transition-all duration-500 sm:h-16 sm:w-16
                                                ${theme === 'dark'
                                                    ? 'border-[#3C3161] bg-[#26194E] [box-shadow:inset_0_2px_10px_rgba(255,255,255,0.02)]'
                                                    : 'border-white bg-white/50 backdrop-blur-xl shadow-[0_8px_16px_rgba(124,58,237,0.1)] group-hover:bg-white group-hover:scale-110 group-hover:border-[#7C3AED]/20'
                                                }
                                            `}
                                        >
                                            <svg
                                                className={`
                                                    h-7 w-7 transition-all duration-500 group-hover:rotate-6
                                                    ${theme === 'dark' 
                                                        ? 'text-white/70 group-hover:text-[#FFCE00]' 
                                                        : 'text-[#7C3AED] group-hover:text-[#4F46E5]'}
                                                `}
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={2.5}
                                                viewBox="0 0 24 24"
                                            >
                                                {activeIcon}
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })} 
				</div>

				<div className="mt-8 flex justify-center">
					<button
						type="button"
						className={`
							cursor-pointer text-sm font-black tracking-[0.2em] transition-all duration-300
							${theme === 'dark'
								? 'text-[#8C84C8] hover:text-[#FFCE00]'
								: 'text-[#A855F7] hover:text-[#7C3AED] hover:translate-x-1'
							}
						`}
					>
						See More
					</button>
				</div>
			</section>
            
            {/* Featured Templates */}
			<section className="mx-auto w-full max-w-none pt-2">
				<div className="mb-5">
					<h3
						className={`
							text-xs sm:text-sm font-bold tracking-[0.18em] uppercase transition-colors duration-300
							${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#8B5CF6]'}
						`}
					>
						Featured Templates
					</h3>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 h-auto lg:h-155">
					<div className="relative rounded-[22px] overflow-hidden h-105 lg:h-full group cursor-pointer hover:-translate-y-0.5 transition-transform">
						<img src="/images/template-portfolio.jpg" alt="PC Website" className="template-pan-img" loading="lazy" />

						<div
							className={`
								absolute inset-0 transition-all duration-500
								${theme === 'dark'
									? 'bg-linear-to-t from-[#0A0730]/95 via-[#0A0730]/40 to-transparent'
									: 'bg-linear-to-t from-white/90 via-white/20 to-transparent group-hover:from-[#F3E8FF]/90'
								}
							`}
						/>

						<div className="absolute bottom-0 left-0 p-6 flex flex-col gap-2">
							<span
								className={`
									text-[10px] font-black tracking-[0.22em] uppercase
									${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#A855F7]'}
								`}
							>
								Template
							</span>
							<h4
								className={`
									text-2xl sm:text-3xl font-extrabold leading-tight transition-colors
									${theme === 'dark' ? 'text-white' : 'text-[#120533]'}
								`}
							>
								Fashion Website
							</h4>
							<button
								type="button"
								className={`
									mt-1 flex items-center gap-2 text-xs font-black tracking-widest uppercase group-hover:gap-3 transition-all duration-200
									${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#A855F7]'}
								`}
							>
								Explore Collection
								<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
								</svg>
							</button>
						</div>
					</div>

					<div className="flex flex-col gap-4 h-full">
						<div className="relative rounded-[22px] overflow-hidden flex-1 group cursor-pointer hover:-translate-y-0.5 transition-transform min-h-60">
							<img src="/images/template-saas.jpg" alt="Simple Website" className="template-pan-img-slow" loading="lazy" />
							<div
								className={`
									absolute inset-0 transition-all duration-500
									${theme === 'dark'
										? 'bg-linear-to-t from-[#0A0730]/90 via-[#0A0730]/30 to-transparent'
										: 'bg-linear-to-t from-white/80 via-white/10 to-transparent'
									}
								`}
							/>
							<div className="absolute bottom-0 left-0 p-5 flex flex-col gap-1">
								<span
									className={`
										text-[10px] font-black tracking-[0.22em] uppercase
										${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#A855F7]'}
									`}
								>
									Template
								</span>
								<h4
									className={`
										text-xl font-extrabold leading-tight
										${theme === 'dark' ? 'text-white' : 'text-[#120533]'}
									`}
								>
									Simple Website
								</h4>
							</div>
						</div>

						<div className="relative rounded-[22px] overflow-hidden flex-1 group cursor-pointer hover:-translate-y-0.5 transition-transform min-h-60">
							<img src="/images/template-fashion.jpg" alt="Fashion Website" className="template-pan-img" loading="lazy" />
							<div
								className={`
									absolute inset-0 transition-all duration-500
									${theme === 'dark'
										? 'bg-linear-to-t from-[#0A0730]/90 via-[#0A0730]/30 to-transparent'
										: 'bg-linear-to-t from-white/80 via-white/10 to-transparent'
									}
								`}
							/>
							<div className="absolute bottom-0 left-0 p-5 flex flex-col gap-1">
								<span
									className={`
										text-[10px] font-black tracking-[0.22em] uppercase
										${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#A855F7]'}
									`}
								>
									Template
								</span>
								<h4
									className={`
										text-xl font-extrabold leading-tight
										${theme === 'dark' ? 'text-white' : 'text-[#120533]'}
									`}
								>
									Fashion Website
								</h4>
							</div>
						</div>
					</div>
				</div>
			</section>
		</motion.div>
	);
}
