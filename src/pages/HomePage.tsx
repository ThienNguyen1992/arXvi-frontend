import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* Sidebar will go here */}
      <aside className="w-64 bg-gray-800 p-4 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Topics</h2>
        <nav>
          <ul>
            <li className="mb-2"><a href="#" className="text-blue-400 hover:text-blue-300">Frontend</a></li>
            <li className="mb-2"><a href="#" className="text-blue-400 hover:text-blue-300">Backend</a></li>
            <li className="mb-2"><a href="#" className="text-blue-400 hover:text-blue-300">DevOps</a></li>
            <li className="mb-2"><a href="#" className="text-blue-400 hover:text-blue-300">AI/ML</a></li>
          </ul>
        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Your Daily Feed</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cards will go here */}
          {[...Array(10)].map((_, index) => (
            <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-semibold mb-2">Sample Card {index + 1}</h3>
              <p className="text-gray-400 text-sm">This is a sample card content. More details about the article or topic will be displayed here.</p>
              <a href="#" className="text-purple-400 hover:text-purple-300 mt-4 block">Read more</a>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
