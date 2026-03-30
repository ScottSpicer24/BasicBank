import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="not-found-page">
      <h1>404</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to="/home">Go Home</Link>
    </div>
  )
}
