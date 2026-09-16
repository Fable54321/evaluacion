import { Link } from "react-router-dom"
import vegibecLogo from "../../assets/vegibec.png"

const Home = () => {
  return (
    <article className= "flex flex-col items-center gap-8 font-primary">
      <div className="w-130 mt-20">
        <img src={vegibecLogo} alt="Vegibec" />
      </div>
      <div className="flex flex-col gap-4">
        <Link to="evaluaciones-mensuales" className="bg-secondary text-white p-2 text-[1.7rem] tracking-tight scale-y-120 rounded-lg hover:bg-primary active:scale-x-98 active:scale-y-105">Evaluaciones mensuales</Link>
        <Link to="variacion-de-desempeno" className="bg-secondary text-white p-2 text-[1.7rem] tracking-tight scale-y-120 rounded-lg hover:bg-primary active:scale-x-98 active:scale-y-105">Variación de desempeño</Link>
      </div>
    </article>
  )
}

export default Home
