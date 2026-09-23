import { Link } from "react-router-dom"
import vegibecLogo from "../../assets/vegibec.png"

const Home = () => {
  return (
    <article className= "flex flex-col items-center md:gap-12 gap-5 font-primary">
      <div className="w-[min(98%,700px)] mt-20">
        <img src={vegibecLogo} alt="Vegibec" />
      </div>
      <div className="flex flex-col md:gap-5 gap-1 text-center ">
        <Link to="evaluaciones-mensuales" className="bg-secondary text-white px-3 py-3 md:text-[1.7rem] tracking-tight md:scale-y-120 rounded-lg hover:bg-primary active:scale-x-98 active:scale-y-105">Evaluaciones mensuales</Link>
        <Link to="variacion-de-desempeno" className="bg-secondary text-white px-3 py-3 md:text-[1.7rem] tracking-tight md:scale-y-120 rounded-lg hover:bg-primary active:scale-x-98 active:scale-y-105">Alertas de desempeño</Link>
      </div>
    </article>
  )
}

export default Home
