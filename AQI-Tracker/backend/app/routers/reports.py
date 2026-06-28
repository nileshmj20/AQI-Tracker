from __future__ import annotations

from fastapi import APIRouter, Query, Response

from app.services.report_service import DOCX_MEDIA_TYPE, PDF_MEDIA_TYPE, build_docx_report, build_pdf_report

router = APIRouter(prefix="/api/report", tags=["reports"])


@router.get("/docx")
async def report_docx(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    name: str | None = Query(None, max_length=180),
) -> Response:
    content, filename = await build_docx_report(lat, lon, name)
    return Response(
        content=content,
        media_type=DOCX_MEDIA_TYPE,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/pdf")
async def report_pdf(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    name: str | None = Query(None, max_length=180),
) -> Response:
    content, filename = await build_pdf_report(lat, lon, name)
    return Response(
        content=content,
        media_type=PDF_MEDIA_TYPE,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
