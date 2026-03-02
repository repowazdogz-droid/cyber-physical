"""Web interface for governance determinations"""
from typing import Dict, Any
from fastapi.responses import HTMLResponse
from output.api_interface import app
from output.public_records import PublicRecordManager
from output.determination_formats import StandardFormats

record_manager = PublicRecordManager()
formats = StandardFormats()

@app.get("/", response_class=HTMLResponse)
async def web_home() -> str:
    """Web interface home page"""
    stats = record_manager.get_statistics()
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>OMEGA-F Governance Determinations</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            h1 {{ color: #333; }}
            .stats {{ background: #f5f5f5; padding: 20px; border-radius: 5px; }}
            .stat-item {{ margin: 10px 0; }}
        </style>
    </head>
    <body>
        <h1>OMEGA-F Governance Determinations</h1>
        <div class="stats">
            <h2>Statistics</h2>
            <div class="stat-item">Total Determinations: {stats.get('total_determinations', 0)}</div>
            <div class="stat-item">Status Distribution: {stats.get('status_distribution', {})}</div>
        </div>
        <h2>API Endpoints</h2>
        <ul>
            <li><a href="/docs">API Documentation</a></li>
            <li><a href="/determinations">List Determinations</a></li>
            <li><a href="/statistics">Statistics</a></li>
        </ul>
    </body>
    </html>
    """
    return html

@app.get("/determinations/{determination_id}/view", response_class=HTMLResponse)
async def view_determination(determination_id: str) -> str:
    """View determination in web format"""
    determination = record_manager.publisher.get_published(determination_id)
    
    if not determination:
        return f"<html><body><h1>Determination {determination_id} not found</h1></body></html>"
    
    markdown = formats.formatter.to_markdown(determination)
    
    # Convert markdown to HTML (simplified)
    html_content = markdown.replace("\n", "<br>").replace("#", "<h1>").replace("##", "<h2>")
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{determination.determination_number}</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            h1 {{ color: #333; }}
            h2 {{ color: #666; }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    return html
