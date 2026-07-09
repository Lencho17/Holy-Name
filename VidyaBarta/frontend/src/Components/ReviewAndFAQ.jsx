import React, { useState } from "react";
import FAQ from "./FAQ";

const ReviewAndFAQ = () => {
  const [email, setEmail] = useState("");
  const [review, setReview] = useState("");

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handleReviewChange = (e) => setReview(e.target.value);

  const handleSubmit = async () => {
    if (email && review) {
      try {
        const response = await fetch("/yeha pe api dedo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, review }),
        });

        if (response.ok) {
          alert("Review submitted successfully!");
          setEmail("");
          setReview("");
        } else {
          alert("Failed to submit review. Please try again.");
        }
      } catch {
        alert(
          "An error occurred while submitting your review. Please try again."
        );
      }
    } else {
      alert("Please fill in both the email and review fields.");
    }
  };

  return (
    <section className="bg-gray-200 text-gray-800 p-4 md:p-10 rounded-lg">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 md:p-6 rounded shadow">
          <h5 className="font-bold mb-4">Review Section</h5>
          <p className="mb-2">
            In order to submit a review, please provide your email ID:
          </p>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          />
          <textarea
            placeholder="Write your review here..."
            value={review}
            onChange={handleReviewChange}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          ></textarea>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Submit Review
          </button>
        </div>
        <div className="bg-white p-4 md:p-6 rounded shadow">
          <FAQ />
        </div>
      </div>
    </section>
  );
};

export default ReviewAndFAQ;
