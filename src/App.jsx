import { useState } from 'react'
// import './App.css'
import EeWrapper from 'src/components/EeWrapper/EeWrapper'
// import { PrimeReactProvider } from 'primereact/api';

import "primereact/resources/themes/lara-light-cyan/theme.css";

function App() {

  // const [count, setCount] = useState(0)
  const entrypoint = import.meta.env.VITE_EE_URL;
  console.log(import.meta.env);

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
