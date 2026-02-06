"use client";

import { useState } from "react";
import { ChevronIcon } from "./index";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqs: FAQ[];
}

export function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-0">
      {faqs.map((faq, index) => (
        <div key={index} className="border-b border-[#9747ff]">
          <button
            onClick={() => toggleFAQ(index)}
            className="flex items-center justify-between w-full text-left py-5 md:py-6 hover:bg-white/30 transition-colors"
          >
            <span className="text-base md:text-xl leading-6 md:leading-7 font-clash-grotesk pr-4 flex-1">
              {faq.question}
            </span>
            <ChevronIcon
              className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 transition-transform duration-300 ${
                openIndex === index ? "rotate-90" : "rotate-0"
              }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openIndex === index
                ? "max-h-[500px] opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="pb-5 md:pb-6 pt-0 md:pt-2">
              <p className="text-sm md:text-base leading-6 md:leading-7 text-[#374151] font-clash-grotesk pr-12 md:pr-16">
                {faq.answer}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
