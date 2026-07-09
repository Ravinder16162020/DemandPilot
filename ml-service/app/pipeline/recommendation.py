from app.schemas import Recommendation, RiskSummary


def build_recommendations(risk: RiskSummary) -> list[Recommendation]:
    if risk.stockout_risk >= 0.7:
        urgency = "CRITICAL"
        order_qty = 140
        reason = "Forecasted demand is above safe coverage window"
    elif risk.stockout_risk >= 0.4:
        urgency = "HIGH"
        order_qty = 90
        reason = "Replenishment suggested to prevent shortfall"
    else:
        urgency = "MONITOR"
        order_qty = 0
        reason = "Current inventory is sufficient for near term"

    return [
        Recommendation(
            sku_id="SKU100",
            store_id="S001",
            order_qty=order_qty,
            urgency=urgency,
            reason=reason,
        )
    ]
