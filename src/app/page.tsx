export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white font-mono px-8">
      <div className="max-w-xl w-full space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-gray-500 text-xs uppercase tracking-[3px]">your project</p>
          <h1 className="text-3xl font-bold break-words">Contractors</h1>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          This is the page of your project. Every time you work with Claude and deploy changes, you'll see them live right here.
        </p>
        <div className="bg-gray-900 border border-gray-800 p-5 space-y-2 text-left">
          <p className="text-gray-500 text-xs uppercase tracking-wider">To start building</p>
          <p className="text-gray-300 text-sm">
            Open the <span className="text-white font-bold">Click Click Claude</span> desktop app and tell Claude what you want to build.
          </p>
        </div>
        <div className="pt-4 border-t border-gray-800">
          <p className="text-gray-600 text-xs">
            built with{" "}
            <a href="https://clickclickclaude.dev" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white underline underline-offset-4 transition-colors">click click claude</a>
          </p>
        </div>
      </div>
    </div>
  );
}
