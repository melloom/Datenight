import { useEffect, useState, useRef, RefObject } from 'react'

interface UseInViewOptions {
  threshold?: number
  rootMargin?: string
  root?: Element | null
}

export function useInView(
  ref: RefObject<Element | null>,
  options: UseInViewOptions = {}
): boolean {
  const { threshold = 0, rootMargin = '0px', root = null } = options
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      {
        threshold,
        rootMargin,
        root,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [ref, threshold, rootMargin, root])

  return isInView
}
