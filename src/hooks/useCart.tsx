import { exit } from 'node:process';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
        const productExistInCart = cart.find(product => product.id == productId)

        if(productExistInCart) {
          const { data: total } = await api.get(`stock/${productId}`);
            
          if(total.amount > productExistInCart.amount ) {

            const persistence = cart.map( item => item.id == productId ? 
              {...item, amount: Number(item.amount) + 1 } 
              : item)

              setCart(persistence);
              localStorage.setItem('@RocketShoes:cart', JSON.stringify(persistence))
              return;

          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }

        } else {
          const { data : product } = await api.get(`products/${productId}`);
          const { data: total } = await api.get(`stock/${productId}`);

          if(total.amount > 0) {
              setCart([...cart, { ...product, amount: 1 }])
              localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, { ...product, amount: 1 }]))
              return;
          }

        }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productToRemove = cart.some(item => item.id === productId);

      if(!productToRemove) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const persistence = cart.filter(item => item.id != productId);

      setCart(persistence);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(persistence))
      return;

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount < 1) {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      const { data: total } = await api.get(`stock/${productId}`);

      if(amount > total.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return ;
      }

      const productExiste = cart.some(item => item.id == productId);

      if(!productExiste) {
        toast.error('Erro na alteração de quantidade do produto');        
        return;
      }

      const newProducts = cart.map(item => item.id == productId ?
        {...item, amount } : item);

      
        setCart(newProducts);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProducts))

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
      return;
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
