'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Loader2, Package, RefreshCw, X } from 'lucide-react'
import ProductReadService, { ProductResponse } from '@/src/actions/product/read'
import { formatCurrencyBRL, shouldDisplayStock } from '@/src/lib/product-rules'

interface ProductDetailModalProps {
  productId: string | null
  initialProduct?: ProductResponse | null
  isOpen: boolean
  onClose: () => void
  onAddToCart?: (product: ProductResponse) => void
}

export default function ProductDetailModal({
  productId,
  initialProduct,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [fetchedProduct, setFetchedProduct] = useState<ProductResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const activeProduct =
    fetchedProduct && fetchedProduct.id === productId
      ? fetchedProduct
      : initialProduct && initialProduct.id === productId
      ? initialProduct
      : null

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', onKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen || !productId) {
      return
    }

    // Se o produto inicial já tem descrição completa, não precisa buscar novamente
    if (initialProduct && initialProduct.id === productId && initialProduct.description) {
      return
    }

    let isCancelled = false

    // Chamada assíncrona para buscar detalhes do produto
    void (async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await ProductReadService(productId)
        if (isCancelled) return
        if (!data) {
          setError('Produto não encontrado.')
        } else {
          setFetchedProduct(data)
        }
      } catch (err) {
        if (isCancelled) return
        console.error('Erro ao buscar produto por ID:', err)
        setError('Não foi possível carregar os detalhes do produto.')
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [isOpen, productId, initialProduct])

  if (!isOpen) {
    return null
  }

  const handleRetry = () => {
    if (!productId) return
    setLoading(true)
    setError(null)
    ProductReadService(productId)
      .then((data) => {
        if (!data) {
          setError('Produto não encontrado.')
        } else {
          setFetchedProduct(data)
        }
      })
      .catch((err) => {
        console.error('Erro ao recarregar produto:', err)
        setError('Não foi possível carregar os detalhes do produto.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181818] p-6 sm:p-8 shadow-2xl text-black dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus-visible:outline-2"
          aria-label="Fechar modal de detalhes"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-500">
            <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
            <p className="text-sm font-medium">Carregando detalhes do produto...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
            <h3 className="text-base font-bold uppercase tracking-tight mb-1">
              Ocorreu um erro
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 max-w-sm">
              {error}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-full bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity focus-visible:outline-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </div>
        ) : !activeProduct ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-10 w-10 text-neutral-400 mb-3" />
            <h3 className="text-base font-bold uppercase tracking-tight mb-1">
              Produto não encontrado
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Os detalhes deste item não puderam ser localizados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Imagem do Produto */}
            <div className="aspect-square w-full rounded-2xl bg-white flex items-center justify-center p-6 border border-black/10 dark:border-white/10 shadow-xs overflow-hidden">
              {activeProduct.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeProduct.image}
                  alt={activeProduct.name}
                  className="h-full w-full object-contain mix-blend-multiply"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-neutral-400">
                  <Package className="h-16 w-16 stroke-1 mb-2" />
                  <span className="text-xs uppercase tracking-wider font-medium">Sem imagem</span>
                </div>
              )}
            </div>

            {/* Informações detalhadas */}
            <div className="flex flex-col h-full justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Detalhes do Produto
                </span>

                <h2
                  id="product-detail-title"
                  className="font-display text-2xl font-extrabold uppercase tracking-tight text-black dark:text-white mt-1"
                >
                  {activeProduct.name}
                </h2>

                {/* Preço formatado em BRL */}
                <div className="mt-4">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                    Preço
                  </span>
                  <span className="font-sans font-extrabold text-2xl sm:text-3xl text-black dark:text-white">
                    {formatCurrencyBRL(activeProduct.price)}
                  </span>
                </div>

                {/* Quantidade em estoque - REGRA: Só exibe se quantidade < 50 */}
                {shouldDisplayStock(activeProduct.quantity) && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 px-3.5 py-2 border border-black/5 dark:border-white/10">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                      Estoque disponível:
                    </span>
                    <span className="font-bold text-xs text-black dark:text-white font-mono">
                      {activeProduct.quantity} {activeProduct.quantity === 1 ? 'unidade' : 'unidades'}
                    </span>
                  </div>
                )}

                {/* Descrição */}
                <div className="mt-5 pt-4 border-t border-black/10 dark:border-white/10">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                    Descrição
                  </span>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 font-sans leading-relaxed whitespace-pre-line">
                    {activeProduct.description?.trim() ? activeProduct.description : 'Sem descrição informada.'}
                  </p>
                </div>
              </div>

              {/* Ação rápida de adicionar caso fornecida */}
              {onAddToCart && (
                <div className="mt-6 pt-4 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    disabled={activeProduct.quantity <= 0}
                    onClick={() => onAddToCart(activeProduct)}
                    className="w-full py-3.5 px-6 rounded-full font-bold text-xs uppercase tracking-wider shadow-lg bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {activeProduct.quantity <= 0 ? 'Produto Esgotado' : 'Adicionar ao Carrinho'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
