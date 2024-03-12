import { useState } from 'react'
// import './App.css'
import EeWrapper from 'src/components/EeWrapper/EeWrapper'
// import { PrimeReactProvider } from 'primereact/api';

import "primereact/resources/themes/lara-light-cyan/theme.css";
import { useSearchParams } from 'react-router-dom';

function App() {

  // const [count, setCount] = useState(0)
  let params = new URL(document.location).searchParams;
  
  const entrypoint = params.get("url") ?? import.meta.env.VITE_EE_URL;
  
  // console.log(import.meta.env);

  return (
    <>
      {/* <PrimeReactProvider> */}
        <div className='w-full h- h-screen'>
          <EeWrapper url={entrypoint} />
        </div>
      {/* </PrimeReactProvider> */}
    </>
  )
}

export default App
