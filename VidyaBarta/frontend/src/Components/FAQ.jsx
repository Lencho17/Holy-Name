import React, { useState, useContext } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';

function FAQ() {
  const { schoolProfile } = useContext(SiteDataContext);
  const faqData = [
    { question: `Why ${schoolProfile?.name || 'Our School'}?`, answer: 'Answer to question 1..' },
    { question: 'Question 2', answer: 'Answer to question 2...' },
    { question: 'Question 3', answer: 'Answer to question 3...' },
    { question: 'Question 4', answer: 'Answer to question 4...' },
    { question: 'Question 5', answer: 'Answer to question 5...' },
  ];

  const [faqs, setFaqs] = useState(faqData.map(faq => ({ ...faq, isOpen: false })));

  const toggleFaq = (index) => {
    setFaqs(
      faqs.map((faq, i) => {
        if (i === index) {
          return { ...faq, isOpen: !faq.isOpen };
        }
        return faq;
      })
    );
  };

  return (
    <div>
      <div className="bg-white p-6 rounded shadow">
        <h5 className="font-bold mb-4">FAQ's</h5>
        {faqs.map((faq, index) => (
          <div key={index} className="mb-4">
            <h6 
              className="font-semibold cursor-pointer" 
              onClick={() => toggleFaq(index)}
            >
              {faq.question}
            </h6>
            {faq.isOpen && <p>{faq.answer}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FAQ;
