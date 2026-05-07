import React from "react";

export const ProductSection = ({
  title = "Featured Products",
  products = [
    {
      name: "Product 1",
      price: "$29.99",
      image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
    },
    {
      name: "Product 2",
      price: "$39.99",
      image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    },
    {
      name: "Product 3",
      price: "$19.99",
      image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=400&q=80",
    },
  ],
}: {
  title?: string;
  products?: { name: string; price: string; image: string }[];
}) => (
  <section className="w-full py-12">
    <h2 className="text-3xl font-bold mb-8 text-brand-dark">{title}</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {products.map((product, idx) => (
        <div key={idx} className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <img src={product.image} alt={product.name} className="w-40 h-40 object-cover rounded-xl mb-4" />
          <div className="font-semibold text-lg mb-2">{product.name}</div>
          <div className="text-brand-primary font-bold text-xl mb-2">{product.price}</div>
          <button className="mt-auto px-6 py-2 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-dark transition">
            View Details
          </button>
        </div>
      ))}
    </div>
  </section>
);

ProductSection.craft = {
  displayName: "ProductSection",
};
