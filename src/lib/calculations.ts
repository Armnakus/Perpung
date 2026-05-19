export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

export const calculateCostPerUnit = (purchasePrice: number, purchaseQuantity: number) => {
  if (!purchaseQuantity || purchaseQuantity <= 0) return 0
  return roundMoney(purchasePrice / purchaseQuantity)
}

export const calculateSaleTotals = (
  quantity: number,
  sellingPrice: number,
  productCost: number,
) => {
  const totalIncome = roundMoney(quantity * sellingPrice)
  const estimatedCost = roundMoney(quantity * productCost)
  const estimatedProfit = roundMoney(totalIncome - estimatedCost)

  return {
    totalIncome,
    estimatedCost,
    estimatedProfit,
  }
}

export type RecipeLine = {
  costPerUnit: number
  quantityUsed: number
}

export const calculateProductCost = (recipe: RecipeLine[]) =>
  roundMoney(
    recipe.reduce((sum, item) => sum + item.costPerUnit * item.quantityUsed, 0),
  )

export const calculateMarginPercent = (sellingPrice: number, productCost: number) => {
  if (!sellingPrice || sellingPrice <= 0) return 0
  return roundMoney(((sellingPrice - productCost) / sellingPrice) * 100)
}

export const getProfitBadge = (sellingPrice: number, productCost: number) => {
  const margin = calculateMarginPercent(sellingPrice, productCost)
  if (margin >= 55) return { label: 'กำไรดี', className: 'bg-mintcream text-emerald-700' }
  if (margin < 35) return { label: 'ต้นทุนสูง', className: 'bg-rosemilk-100 text-rose-700' }
  return { label: 'สมดุล', className: 'bg-cream-100 text-cocoa-600' }
}
