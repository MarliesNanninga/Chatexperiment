import InterviewPracticeBot from '@/components/InterviewPracticeBot'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6" />
            </svg>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Sollicitatiegesprek Trainer
          </h1>
          
          <p className="text-xl text-blue-700 font-medium mb-6">
            Oefen je sollicitatievaardigheden met AI-powered gesprekssimulaties
          </p>

          <div className="max-w-3xl mx-auto text-gray-600 mb-8">
            <p className="mb-4">
              Bereid je voor op je volgende sollicitatiegesprek! Deze AI-trainer helpt je oefenen met verschillende soorten vragen, 
              geeft feedback op je antwoorden en bouwt je zelfvertrouwen op.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold text-gray-800">Gepersonaliseerd</h3>
                <p className="text-sm text-gray-600">Aangepast aan jouw functie en ervaring</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl mb-2">💡</div>
                <h3 className="font-semibold text-gray-800">Slimme Feedback</h3>
                <p className="text-sm text-gray-600">Krijg tips om je antwoorden te verbeteren</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-2xl mb-2">🚀</div>
                <h3 className="font-semibold text-gray-800">Zelfvertrouwen</h3>
                <p className="text-sm text-gray-600">Bouw ervaring op in een veilige omgeving</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <InterviewPracticeBot />
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-4 text-blue-600">
            <span>💼</span>
            <span>Veel succes met je sollicitatiegesprek!</span>
            <span>💼</span>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Sollicitatiegesprek Trainer • Powered by Gemini AI
          </p>
        </div>
      </div>
    </div>
  )
}