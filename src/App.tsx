import { useState } from 'react'
import { Article } from '@/data/schema'
import MainLayout from '@/components/layout/MainLayout'

function App() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  return (
    <MainLayout 
      selectedArticle={selectedArticle}
      onArticleSelect={setSelectedArticle}
    />
  )
}

export default App