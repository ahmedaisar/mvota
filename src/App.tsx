import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import ResortDetail from './pages/ResortDetail';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';
import Trips from './pages/Trips';
import Offers from './pages/Offers';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/resort/:slug" element={<ResortDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/confirmation/:code" element={<Confirmation />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
