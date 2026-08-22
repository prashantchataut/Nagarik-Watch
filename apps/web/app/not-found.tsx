import { PublicErrorState } from '@/components/system/PublicErrorState'

export default function NotFound() {
  return (
    <PublicErrorState
      locale="ne"
      code="404"
      title="पृष्ठ फेला परेन"
      body="लिंक पुरानो, सारिएको वा गलत हुन सक्छ। समाचार खोज्नुहोस् वा ताजा समाचारबाट सुरु गर्नुहोस्।"
      showSearch
    />
  )
}
