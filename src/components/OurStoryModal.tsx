import heroImage from "@/assets/officelogo.jpg";

const OurStoryModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-3">
      {/* Modal Box */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-2xl max-h-[85vh] overflow-y-auto animate-fade-in-up">
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-xl sm:text-2xl text-gray-500 hover:text-textile-silk transition"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        {/* Hero Image */}
        <div className="h-32 sm:h-48 w-full rounded-t-xl overflow-hidden">
          <img
            src={heroImage}
            alt="Techtide Co. - company overview header image"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-3xl font-serif font-bold mb-3 text-textile-charcoal text-center">
            Our Story
          </h2>

          <p className="text-sm sm:text-lg text-gray-600 mb-4 leading-relaxed text-center">
            Software development, information technology, and cloud services.  
            Welcome to <span className="font-semibold text-black">Techtide Co.</span>’s company profile.  
            We focus on delivering technology solutions across industries — 
            helping businesses innovate, transform, and grow.
          </p>

          <ul className="list-disc pl-4 sm:pl-6 text-sm sm:text-base text-gray-700 space-y-2 mb-4">
            <li>
              To become the leading technology company by providing innovative
              solutions that drive global business advancement.
            </li>
            <li>
              To develop technology that enables businesses to transform digitally,
              increase efficiency, and achieve significant outcomes.
            </li>
            <li>
              Founded in 2021 with a mission to support digital transformation and
              business efficiency through modern solutions.
            </li>
          </ul>

          {/* Footer / Highlight */}
          <div className="text-center mt-4">
            <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-textile-silk to-yellow-200 text-textile-charcoal font-semibold shadow text-sm sm:text-base">
              Thank you for being part of our story!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurStoryModal;
