"""PROJECT PYROS — NASA Space Apps Presentation Generator
Generates a polished 7-slide, 16:9 widescreen PowerPoint presentation (.pptx)
with authentic NASA PSI data, distinct high-resolution imagery, and captions.
"""

from __future__ import annotations

import os
from pathlib import Path
from PIL import Image

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE


# ── Color Palette (Aerospace Deep Space & HUD) ───────────────────────────────────

COLOR_BG = RGBColor(10, 15, 29)          # Deep Navy #0A0F1D
COLOR_CARD = RGBColor(17, 24, 39)        # Slate Dark #111827
COLOR_CARD_BORDER = RGBColor(40, 54, 85) # Slate Border #283655
COLOR_CARD_ALT = RGBColor(24, 33, 56)    # Elevated Card #182138
COLOR_WHITE = RGBColor(248, 250, 252)    # Pure White #F8FAFC
COLOR_SLATE = RGBColor(148, 163, 184)    # Muted Slate #94A3B8
COLOR_CYAN = RGBColor(56, 189, 248)      # Electric Cyan #38BDF8
COLOR_AMBER = RGBColor(245, 158, 11)     # Warning Amber #F59E0B
COLOR_ROSE = RGBColor(244, 63, 94)       # Thermal Rose #F43F5E
COLOR_GREEN = RGBColor(16, 185, 129)     # Verified Green #10B981


def fit_image_box(img_path: str, target_left: float, target_top: float, target_width: float, target_height: float):
    """Calculates fitted dimensions and offsets to maintain image aspect ratio within box."""
    with Image.open(img_path) as im:
        w, h = im.size
    aspect = w / h
    box_aspect = target_width / target_height

    if aspect > box_aspect:
        actual_w = target_width
        actual_h = target_width / aspect
    else:
        actual_h = target_height
        actual_w = target_height * aspect

    actual_left = target_left + (target_width - actual_w) / 2
    actual_top = target_top + (target_height - actual_h) / 2
    return actual_left, actual_top, actual_w, actual_h


def add_header(slide, tag_text: str, title_text: str, slide_num: int):
    """Adds a standard top HUD banner to a slide."""
    # Top Tag / Category Pill
    tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(8.0), Inches(0.35))
    tf_tag = tag_box.text_frame
    tf_tag.word_wrap = True
    tf_tag.margin_left = tf_tag.margin_top = tf_tag.margin_right = tf_tag.margin_bottom = 0
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = tag_text.upper()
    p_tag.font.size = Pt(9.5)
    p_tag.font.bold = True
    p_tag.font.color.rgb = COLOR_CYAN
    p_tag.alignment = PP_ALIGN.LEFT

    # Title
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.72), Inches(9.5), Inches(0.55))
    tf_title = title_box.text_frame
    tf_title.word_wrap = True
    tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
    p_title = tf_title.paragraphs[0]
    p_title.text = title_text
    p_title.font.size = Pt(22)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_WHITE
    p_title.alignment = PP_ALIGN.LEFT

    # Slide Number & Project Badge (Top Right)
    badge_box = slide.shapes.add_textbox(Inches(10.5), Inches(0.45), Inches(2.0), Inches(0.5))
    tf_badge = badge_box.text_frame
    tf_badge.margin_left = tf_badge.margin_top = tf_badge.margin_right = tf_badge.margin_bottom = 0
    p_badge = tf_badge.paragraphs[0]
    p_badge.alignment = PP_ALIGN.RIGHT
    p_badge.text = f"SLIDE 0{slide_num} / 07"
    p_badge.font.size = Pt(11)
    p_badge.font.bold = True
    p_badge.font.color.rgb = COLOR_SLATE

    # Subtle horizontal line below header
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.35), Inches(11.733), Inches(0.015))
    line.fill.solid()
    line.fill.fore_color.rgb = COLOR_CARD_BORDER
    line.line.color.rgb = COLOR_CARD_BORDER


def add_footer(slide):
    """Adds a clean bottom watermark line to each slide."""
    footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(11.733), Inches(0.3))
    tf = footer_box.text_frame
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = "PROJECT PYROS // NASA Space Apps Challenge 2026 // Physical Sciences Informatics (PSI) Fire Safety"
    p.font.size = Pt(8.5)
    p.font.color.rgb = RGBColor(90, 105, 130)
    p.alignment = PP_ALIGN.LEFT


def create_presentation(output_path: str = "PROJECT_PYROS_NASA_7_SLIDES.pptx"):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    repo_root = Path(__file__).resolve().parent.parent

    # ═════════════════════════════════════════════════════════════════════════════
    # SLIDE 1: Title & Executive Vision
    # ═════════════════════════════════════════════════════════════════════════════
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = COLOR_BG
    bg1.line.color.rgb = COLOR_BG

    # Top Brand Bar
    brand_box = slide1.shapes.add_textbox(Inches(0.8), Inches(0.65), Inches(10.0), Inches(0.4))
    tf = brand_box.text_frame
    p = tf.paragraphs[0]
    p.text = "NASA SPACE APPS CHALLENGE // PHYSICAL SCIENCES INFORMATICS"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = COLOR_CYAN
    p.alignment = PP_ALIGN.LEFT

    # Title & Subtitle
    title_box = slide1.shapes.add_textbox(Inches(0.8), Inches(1.05), Inches(6.8), Inches(1.7))
    tf = title_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "PROJECT PYROS"
    p.font.size = Pt(38)
    p.font.bold = True
    p.font.color.rgb = COLOR_WHITE
    p.alignment = PP_ALIGN.LEFT

    p2 = tf.add_paragraph()
    p2.text = "Autonomous SI Fire Safety Intelligence Platform & 3D Simulation Suite"
    p2.font.size = Pt(14)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_AMBER
    p2.alignment = PP_ALIGN.LEFT

    # Left Column: Executive Summary Card
    card1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.85), Inches(6.5), Inches(4.0))
    card1.fill.solid()
    card1.fill.fore_color.rgb = COLOR_CARD
    card1.line.color.rgb = COLOR_CARD_BORDER

    tf_c1 = card1.text_frame
    tf_c1.word_wrap = True
    tf_c1.margin_left = tf_c1.margin_right = tf_c1.margin_top = tf_c1.margin_bottom = Inches(0.25)

    bullets1 = [
        ("THE CORE MISSION", "Unifying 20+ years of microgravity combustion science from the NASA PSI repository into an actionable, AI-powered fire safety platform."),
        ("HABITABLE CREW WORLDS", "Predicting flammability, ignition risk, and smoke propagation across Orbital Spacecraft, Space Stations, Moon Bases, Martian Outposts, and Pressurized Rovers."),
        ("ZERO-MOCKUP INTEGRITY", "100% verified flight data from 22 NASA investigations bound by deterministic combustion scaling laws (Roper flame height, Grashof convection, Dalton oxygen partial pressure)."),
        ("DUAL MISSION IMPACT", "Informing next-generation deep-space fire safety controls (fine-water mist, hypoxic venting) while accelerating life-saving terrestrial firefighting spinoffs on Earth.")
    ]

    for idx, (head, body) in enumerate(bullets1):
        p_head = tf_c1.paragraphs[0] if idx == 0 else tf_c1.add_paragraph()
        p_head.alignment = PP_ALIGN.LEFT
        p_head.text = f"• {head}: "
        p_head.font.size = Pt(11)
        p_head.font.bold = True
        p_head.font.color.rgb = COLOR_CYAN

        run = p_head.add_run()
        run.text = body
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = COLOR_WHITE
        p_head.space_after = Pt(8)

    # Right Column: Visual Frame + Caption
    img1_path = str(repo_root / "frontend" / "public" / "assets" / "showcase" / "art_iss@2x.png")
    if os.path.exists(img1_path):
        frame1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.5), Inches(1.1), Inches(5.0), Inches(5.75))
        frame1.fill.solid()
        frame1.fill.fore_color.rgb = COLOR_CARD
        frame1.line.color.rgb = COLOR_CARD_BORDER

        logo_path = str(repo_root / "frontend" / "public" / "assets" / "logo.png")
        nasa_path = str(repo_root / "frontend" / "public" / "assets" / "nasa.png")
        
        i_left, i_top, i_w, i_h = fit_image_box(img1_path, Inches(7.7), Inches(1.3), Inches(4.6), Inches(4.15))
        slide1.shapes.add_picture(img1_path, i_left, i_top, i_w, i_h)

        if os.path.exists(logo_path):
            slide1.shapes.add_picture(logo_path, Inches(7.8), Inches(1.4), Inches(0.65), Inches(0.65))
        if os.path.exists(nasa_path):
            slide1.shapes.add_picture(nasa_path, Inches(11.2), Inches(1.4), Inches(0.9), Inches(0.35))

        cap_box = slide1.shapes.add_textbox(Inches(7.7), Inches(5.6), Inches(4.6), Inches(1.0))
        tf_cap = cap_box.text_frame
        tf_cap.word_wrap = True
        tf_cap.margin_left = tf_cap.margin_top = tf_cap.margin_right = tf_cap.margin_bottom = 0
        p_cap = tf_cap.paragraphs[0]
        p_cap.text = "Figure 1: Orbital microgravity testing aboard the International Space Station (ISS) integrated into the PROJECT PYROS intelligence architecture."
        p_cap.font.size = Pt(9.5)
        p_cap.font.italic = True
        p_cap.font.color.rgb = COLOR_SLATE
        p_cap.alignment = PP_ALIGN.LEFT

    add_footer(slide1)

    # ═════════════════════════════════════════════════════════════════════════════
    # SLIDE 2: The NASA PSI Challenge & The Data Dilemma
    # ═════════════════════════════════════════════════════════════════════════════
    slide2 = prs.slides.add_slide(blank_layout)
    bg2 = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg2.fill.solid()
    bg2.fill.fore_color.rgb = COLOR_BG
    bg2.line.color.rgb = COLOR_BG

    add_header(slide2, "Operational Problem & Challenge Directives", "The Microgravity Combustion Data Dilemma", 2)

    card2_l = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(6.8), Inches(5.3))
    card2_l.fill.solid()
    card2_l.fill.fore_color.rgb = COLOR_CARD
    card2_l.line.color.rgb = COLOR_CARD_BORDER

    tf2 = card2_l.text_frame
    tf2.word_wrap = True
    tf2.margin_left = tf2.margin_right = tf2.margin_top = tf2.margin_bottom = Inches(0.25)

    p = tf2.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    p.text = "THE PROBLEM STATEMENT"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_AMBER
    p.space_after = Pt(4)

    p_body = tf2.add_paragraph()
    p_body.alignment = PP_ALIGN.LEFT
    p_body.text = "NASA's Physical Sciences Informatics (PSI) database holds over two decades of combustion experiments conducted aboard the ISS and Space Shuttle. However, the data is vast, siloed across different flight apparatuses, difficult to cross-compare, and challenging to extrapolate to exploration destinations."
    p_body.font.size = Pt(10)
    p_body.font.color.rgb = COLOR_WHITE
    p_body.space_after = Pt(10)

    p_obj = tf2.add_paragraph()
    p_obj.alignment = PP_ALIGN.LEFT
    p_obj.text = "FOUR OFFICIAL OBJECTIVES SOLVED BY PROJECT PYROS:"
    p_obj.font.size = Pt(11.5)
    p_obj.font.bold = True
    p_obj.font.color.rgb = COLOR_CYAN
    p_obj.space_after = Pt(4)

    objs = [
        ("1. Habitable Crew Environments", "Autonomous ranking of research for space stations, spacecraft, lunar bases, Martian outposts, and pressurized rovers."),
        ("2. Predictive Flammability Modeling", "Deterministic physics constraints (Roper flame height, Grashof velocity, O2 enhancement) bounding fire behavior."),
        ("3. Next-Gen Fire Safety Equipment", "Data-driven insights guiding fine-water mist extinguishers, dual-wavelength smoke detectors, and emergency venting."),
        ("4. Terrestrial Earth Spinoffs", "Translating spaceflight research to municipal firefighter turnout coats, composite SCBA tanks, and mine particulate monitors.")
    ]

    for title, desc in objs:
        p_item = tf2.add_paragraph()
        p_item.alignment = PP_ALIGN.LEFT
        p_item.text = f"• {title}: "
        p_item.font.size = Pt(10)
        p_item.font.bold = True
        p_item.font.color.rgb = COLOR_GREEN

        run = p_item.add_run()
        run.text = desc
        run.font.size = Pt(9.5)
        run.font.bold = False
        run.font.color.rgb = COLOR_SLATE
        p_item.space_after = Pt(5)

    card2_r = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.5), Inches(4.733), Inches(5.3))
    card2_r.fill.solid()
    card2_r.fill.fore_color.rgb = COLOR_CARD
    card2_r.line.color.rgb = COLOR_CARD_BORDER

    img2_path = str(repo_root / "frontend" / "public" / "assets" / "cards" / "art_combustion@2x.png")
    if os.path.exists(img2_path):
        i_left, i_top, i_w, i_h = fit_image_box(img2_path, Inches(8.0), Inches(1.7), Inches(4.333), Inches(2.6))
        slide2.shapes.add_picture(img2_path, i_left, i_top, i_w, i_h)

        cap2_box = slide2.shapes.add_textbox(Inches(8.0), Inches(4.4), Inches(4.333), Inches(0.9))
        tf_cap2 = cap2_box.text_frame
        tf_cap2.word_wrap = True
        tf_cap2.margin_left = tf_cap2.margin_top = tf_cap2.margin_right = tf_cap2.margin_bottom = 0
        p_cap2 = tf_cap2.paragraphs[0]
        p_cap2.text = "Figure 2: Microgravity diffusion flame dynamics in the CIR chamber, showing absence of natural buoyant convection and formation of a soot-free spherical reaction zone."
        p_cap2.font.size = Pt(9.5)
        p_cap2.font.italic = True
        p_cap2.font.color.rgb = COLOR_SLATE
        p_cap2.alignment = PP_ALIGN.LEFT

    aud_box = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.0), Inches(5.4), Inches(4.333), Inches(1.2))
    aud_box.fill.solid()
    aud_box.fill.fore_color.rgb = COLOR_CARD_ALT
    aud_box.line.color.rgb = COLOR_CYAN
    tf_aud = aud_box.text_frame
    tf_aud.word_wrap = True
    tf_aud.margin_left = tf_aud.margin_right = tf_aud.margin_top = tf_aud.margin_bottom = Inches(0.12)
    p_aud_t = tf_aud.paragraphs[0]
    p_aud_t.alignment = PP_ALIGN.LEFT
    p_aud_t.text = "TARGET AUDIENCE & STAKEHOLDERS"
    p_aud_t.font.size = Pt(10.5)
    p_aud_t.font.bold = True
    p_aud_t.font.color.rgb = COLOR_CYAN
    p_aud_b = tf_aud.add_paragraph()
    p_aud_b.alignment = PP_ALIGN.LEFT
    p_aud_b.text = "Aerospace Safety Engineers • NASA Mission Flight Directors • Combustion Science Professors • Graduate & Undergraduate Researchers"
    p_aud_b.font.size = Pt(9.5)
    p_aud_b.font.color.rgb = COLOR_WHITE

    add_footer(slide2)

    # ═════════════════════════════════════════════════════════════════════════════
    # SLIDE 3: System Architecture — The SI Autonomous Engine
    # ═════════════════════════════════════════════════════════════════════════════
    slide3 = prs.slides.add_slide(blank_layout)
    bg3 = slide3.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg3.fill.solid()
    bg3.fill.fore_color.rgb = COLOR_BG
    bg3.line.color.rgb = COLOR_BG

    add_header(slide3, "Core Architecture & Data Foundation", "SI Knowledge Engine & Deterministic Graph", 3)

    card3_l = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(6.8), Inches(5.3))
    card3_l.fill.solid()
    card3_l.fill.fore_color.rgb = COLOR_CARD
    card3_l.line.color.rgb = COLOR_CARD_BORDER

    tf3 = card3_l.text_frame
    tf3.word_wrap = True
    tf3.margin_left = tf3.margin_right = tf3.margin_top = tf3.margin_bottom = Inches(0.25)

    arch_blocks = [
        ("22 VERIFIED NASA MISSIONS (100% AUTHENTIC)", 
         "Populated with actual flight parameters from NASA PSI: ACME suite (6 experiments), BASS I & II, Saffire I-III, FLEX / FLEX-2, CFI, SAME, DAFT, and Artemis precedents (LUCI, FM2). Zero synthetic mockups.",
         COLOR_CYAN),
        ("352-EDGE RELATIONAL KNOWLEDGE MULTIGRAPH",
         "NetworkX topology linking investigations by shared hardware facilities (CIR, MSG, Cygnus), fuel geometries, oxygen ranges (14% to 85%), diagnostic sensors, and instrument reuse lineages.",
         COLOR_AMBER),
        ("HYBRID RETRIEVAL & SCIENTIFIC CHUNKING",
         "Combines BM25 sparse keyword ranking with FAISS dense vector retrieval. 5-facet chunking slices each experiment into Objectives, Approach, Fuels, Atmosphere, and Key Findings.",
         COLOR_GREEN),
        ("DUAL AUTONOMOUS OPERATING MODES",
         "• Data-Only Mode: Pure Python deterministic physics calculations, graph searches, and parameter filtering (Zero API key required).\n• Full LLM Mode: Multi-investigation scenario synthesis, cross-comparison, and safety ranking.",
         COLOR_ROSE)
    ]

    for idx, (title, desc, color) in enumerate(arch_blocks):
        p_t = tf3.paragraphs[0] if idx == 0 else tf3.add_paragraph()
        p_t.alignment = PP_ALIGN.LEFT
        p_t.text = title
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = color
        p_t.space_after = Pt(2)

        p_d = tf3.add_paragraph()
        p_d.alignment = PP_ALIGN.LEFT
        p_d.text = desc
        p_d.font.size = Pt(9.3)
        p_d.font.color.rgb = COLOR_WHITE
        p_d.space_after = Pt(7)

    card3_r = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.5), Inches(4.733), Inches(5.3))
    card3_r.fill.solid()
    card3_r.fill.fore_color.rgb = COLOR_CARD
    card3_r.line.color.rgb = COLOR_CARD_BORDER

    img3_path = str(repo_root / "frontend" / "public" / "assets" / "cards" / "art_mars@2x.png")
    if os.path.exists(img3_path):
        i_left, i_top, i_w, i_h = fit_image_box(img3_path, Inches(8.0), Inches(1.7), Inches(4.333), Inches(2.7))
        slide3.shapes.add_picture(img3_path, i_left, i_top, i_w, i_h)

        cap3_box = slide3.shapes.add_textbox(Inches(8.0), Inches(4.45), Inches(4.333), Inches(0.9))
        tf_cap3 = cap3_box.text_frame
        tf_cap3.word_wrap = True
        tf_cap3.margin_left = tf_cap3.margin_top = tf_cap3.margin_right = tf_cap3.margin_bottom = 0
        p_cap3 = tf_cap3.paragraphs[0]
        p_cap3.alignment = PP_ALIGN.LEFT
        p_cap3.text = "Figure 3: Multi-facet retrieval engine and 352-edge knowledge graph linking flight racks, sensor configurations, and physical scaling laws."
        p_cap3.font.size = Pt(9.5)
        p_cap3.font.italic = True
        p_cap3.font.color.rgb = COLOR_SLATE

    metric_box = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.0), Inches(5.45), Inches(4.333), Inches(1.15))
    metric_box.fill.solid()
    metric_box.fill.fore_color.rgb = COLOR_CARD_ALT
    metric_box.line.color.rgb = COLOR_GREEN
    tf_m = metric_box.text_frame
    tf_m.word_wrap = True
    tf_m.margin_left = tf_m.margin_right = tf_m.margin_top = tf_m.margin_bottom = Inches(0.12)
    p_mt = tf_m.paragraphs[0]
    p_mt.alignment = PP_ALIGN.LEFT
    p_mt.text = "VERIFIED SYSTEM METRICS"
    p_mt.font.size = Pt(10.5)
    p_mt.font.bold = True
    p_mt.font.color.rgb = COLOR_GREEN
    p_mb = tf_m.add_paragraph()
    p_mb.alignment = PP_ALIGN.LEFT
    p_mb.text = "22 Flight Investigations • 352 Directed Edges • 110 Document Chunks • 27/27 Challenge Verifications Passed • 25/25 Unit Tests Passed"
    p_mb.font.size = Pt(9.3)
    p_mb.font.color.rgb = COLOR_WHITE

    add_footer(slide3)

    # ═════════════════════════════════════════════════════════════════════════════
    # SLIDE 4: Habitable Environments & 3D WebGL Simulation Suite
    # ═════════════════════════════════════════════════════════════════════════════
    slide4 = prs.slides.add_slide(blank_layout)
    bg4 = slide4.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg4.fill.solid()
    bg4.fill.fore_color.rgb = COLOR_BG
    bg4.line.color.rgb = COLOR_BG

    add_header(slide4, "3D Scientific Simulation Suite", "Four Operational Exploration Worlds (Three.js WebGL)", 4)

    card4_l = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(6.8), Inches(5.3))
    card4_l.fill.solid()
    card4_l.fill.fore_color.rgb = COLOR_CARD
    card4_l.line.color.rgb = COLOR_CARD_BORDER

    tf4 = card4_l.text_frame
    tf4.word_wrap = True
    tf4.margin_left = tf4.margin_right = tf4.margin_top = tf4.margin_bottom = Inches(0.25)

    worlds = [
        ("1. SPACE STATION LAB (0.00g // station.html)",
         "Full orbital camera flight inside ISS Destiny & Columbus modules. Real-time Eulerian Navier-Stokes candle diffusion flame demonstrating isotropic molecular diffusion. Live ECLSS controls (O2%, total pressure, ventilation speed). Dedicated 22-mission dossier explorer.",
         COLOR_CYAN),
        ("2. ARTEMIS MOON BASE (0.166g // moon.html)",
         "Shackleton Crater rim terrain; MLI-insulated Hab pods; active solar array & fuel cell grid; LUCI/FM2 partial-g testbeds. 5 interactive modes: Normal View, Power Flow, ECLSS Life Support (10.2 psi, 34% O2), FLIR Thermal View, and Emergency Failure Shedding.",
         COLOR_AMBER),
        ("3. MARTIAN ROVER AVIONICS (0.38g // rover.html)",
         "Photorealistic interior of Mars Science Rover Warm Electronics Box (WEB). Elevated PCU on 24mm brass standoffs for thermal isolation. 7-stage chronological failure sequence: Normal -> Overstress -> Micro-arcing -> Local Fire -> Autonomous Safe Mode.",
         COLOR_ROSE),
        ("4. MARS SURFACE OUTPOST (0.38g // mars.html)",
         "Geologically accurate Jezero Crater dunes, Surveyor lander, and Ice Home dome. Interactive Hypoxic Extinction Venting testbed: vents pressurized habitat air (101.3 kPa, 21% O2) into Martian ambient (0.636 kPa, 0.13% O2) to demonstrate instant flame asphyxiation.",
         COLOR_GREEN)
    ]

    for idx, (title, desc, color) in enumerate(worlds):
        p_t = tf4.paragraphs[0] if idx == 0 else tf4.add_paragraph()
        p_t.alignment = PP_ALIGN.LEFT
        p_t.text = title
        p_t.font.size = Pt(10.5)
        p_t.font.bold = True
        p_t.font.color.rgb = color
        p_t.space_after = Pt(2)

        p_d = tf4.add_paragraph()
        p_d.alignment = PP_ALIGN.LEFT
        p_d.text = desc
        p_d.font.size = Pt(9.1)
        p_d.font.color.rgb = COLOR_WHITE
        p_d.space_after = Pt(6)

    card4_r = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.5), Inches(4.733), Inches(5.3))
    card4_r.fill.solid()
    card4_r.fill.fore_color.rgb = COLOR_CARD
    card4_r.line.color.rgb = COLOR_CARD_BORDER

    img4_path = str(repo_root / "image" / "moon.png")
    if not os.path.exists(img4_path):
        img4_path = str(repo_root / "frontend" / "public" / "assets" / "showcase" / "art_moon_icehome@2x.png")

    if os.path.exists(img4_path):
        i_left, i_top, i_w, i_h = fit_image_box(img4_path, Inches(8.0), Inches(1.7), Inches(4.333), Inches(2.7))
        slide4.shapes.add_picture(img4_path, i_left, i_top, i_w, i_h)

        cap4_box = slide4.shapes.add_textbox(Inches(8.0), Inches(4.45), Inches(4.333), Inches(0.9))
        tf_cap4 = cap4_box.text_frame
        tf_cap4.word_wrap = True
        tf_cap4.margin_left = tf_cap4.margin_top = tf_cap4.margin_right = tf_cap4.margin_bottom = 0
        p_cap4 = tf_cap4.paragraphs[0]
        p_cap4.alignment = PP_ALIGN.LEFT
        p_cap4.text = "Figure 4: Interactive 3D WebGL scientific simulations of Artemis Base Camp at Shackleton Crater and pressurized rover avionics enclosures."
        p_cap4.font.size = Pt(9.5)
        p_cap4.font.italic = True
        p_cap4.font.color.rgb = COLOR_SLATE

    tech_box = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.0), Inches(5.45), Inches(4.333), Inches(1.15))
    tech_box.fill.solid()
    tech_box.fill.fore_color.rgb = COLOR_CARD_ALT
    tech_box.line.color.rgb = COLOR_AMBER
    tf_tech = tech_box.text_frame
    tf_tech.word_wrap = True
    tf_tech.margin_left = tf_tech.margin_right = tf_tech.margin_top = tf_tech.margin_bottom = Inches(0.12)
    p_tt = tf_tech.paragraphs[0]
    p_tt.alignment = PP_ALIGN.LEFT
    p_tt.text = "RENDERING & SIMULATION STACK"
    p_tt.font.size = Pt(10.5)
    p_tt.font.bold = True
    p_tt.font.color.rgb = COLOR_AMBER
    p_tb = tf_tech.add_paragraph()
    p_tb.alignment = PP_ALIGN.LEFT
    p_tb.text = "Three.js r170 WebGL • Procedural Surface Mesh Geometry • GLSL Flame Shaders • FLIR False-Color Thermal Imaging • Real-time Physics Convection"
    p_tb.font.size = Pt(9.3)
    p_tb.font.color.rgb = COLOR_WHITE

    add_footer(slide4)

    # ═════════════════════════════════════════════════════════════════════════════
    # SLIDE 5: Atmospheric Regimes & Hyperoxic Flammability Risks
    # ═════════════════════════════════════════════════════════════════════════════
    slide5 = prs.slides.add_slide(blank_layout)
    bg5 = slide5.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg5.fill.solid()
    bg5.fill.fore_color.rgb = COLOR_BG
    bg5.line.color.rgb = COLOR_BG

    add_header(slide5, "Physiological Trade-offs & Flammability Surge", "Spacesuits vs. Moon Base vs. CFI-G: The Flammability Surge", 5)

    card5_l = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(6.8), Inches(5.3))
    card5_l.fill.solid()
    card5_l.fill.fore_color.rgb = COLOR_CARD
    card5_l.line.color.rgb = COLOR_CARD_BORDER

    tf5 = card5_l.text_frame
    tf5.word_wrap = True
    tf5.margin_left = tf5.margin_right = tf5.margin_top = tf5.margin_bottom = Inches(0.25)

    p_t = tf5.paragraphs[0]
    p_t.alignment = PP_ALIGN.LEFT
    p_t.text = "ATMOSPHERIC REGIMES & PARTIAL PRESSURE DATA"
    p_t.font.size = Pt(11.5)
    p_t.font.bold = True
    p_t.font.color.rgb = COLOR_AMBER
    p_t.space_after = Pt(4)

    regimes = [
        ("Earth Sea Level (Baseline)", "14.7 psi • 21.0% O2 • P_O2 = 3.09 psi • 1.00x Flammability Index"),
        ("Moon Base & Rover (Artemis)", "10.2 psi • 34.0% O2 • P_O2 = 3.47 psi • 1.18x Flammability (>40% O2 surge)"),
        ("Spacesuit EVA (High Mobility)", "4.3 psi • 100.0% O2 • P_O2 = 4.30 psi • 1.59x Flammability (Hyperoxic)"),
        ("ACME CFI-G (ISS Flight Record)", "14.7 psi • 85.0% O2 • P_O2 = 12.49 psi • 7.08x Flammability (Extreme)")
    ]

    for title, stats in regimes:
        p_r = tf5.add_paragraph()
        p_r.alignment = PP_ALIGN.LEFT
        p_r.text = f"• {title}: "
        p_r.font.size = Pt(10)
        p_r.font.bold = True
        p_r.font.color.rgb = COLOR_CYAN

        run = p_r.add_run()
        run.text = stats
        run.font.size = Pt(9.5)
        run.font.bold = False
        run.font.color.rgb = COLOR_WHITE
        p_r.space_after = Pt(3)

    p_eng = tf5.add_paragraph()
    p_eng.alignment = PP_ALIGN.LEFT
    p_eng.text = "THE PRE-BREATHE DILEMMA & THE FLAMMABILITY TRADE-OFF:"
    p_eng.font.size = Pt(11)
    p_eng.font.bold = True
    p_eng.font.color.rgb = COLOR_ROSE
    p_eng.space_before = Pt(6)
    p_eng.space_after = Pt(2)

    p_eng_b = tf5.add_paragraph()
    p_eng_b.alignment = PP_ALIGN.LEFT
    p_eng_b.text = "1. Why 4.3 psi in spacesuits? Depressurization is mandatory so astronauts can bend joints and fingers; 100% pure O2 is required to maintain human life support.\n2. The Pre-Breathe Purge: To prevent decompression sickness ('the bends'), astronauts must pre-breathe 100% O2 for hours at 14.7 psi to expel bloodstream nitrogen.\n3. The Moon Base Solution: Operating at 10.2 psi with 34% O2 slashes pre-breathing from hours to minutes, enabling routine EVAs. However, this >40% increase in oxygen concentration drastically accelerates flame spread and lowers material ignition thresholds."
    p_eng_b.font.size = Pt(9.2)
    p_eng_b.font.color.rgb = COLOR_WHITE
    p_eng_b.space_after = Pt(4)

    card5_r = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.5), Inches(4.733), Inches(5.3))
    card5_r.fill.solid()
    card5_r.fill.fore_color.rgb = COLOR_CARD
    card5_r.line.color.rgb = COLOR_CARD_BORDER

    img5_path = str(repo_root / "frontend" / "public" / "assets" / "showcase" / "art_astronaut@2x.png")
    if os.path.exists(img5_path):
        i_left, i_top, i_w, i_h = fit_image_box(img5_path, Inches(8.0), Inches(1.7), Inches(4.333), Inches(2.7))
        slide5.shapes.add_picture(img5_path, i_left, i_top, i_w, i_h)

        cap5_box = slide5.shapes.add_textbox(Inches(8.0), Inches(4.45), Inches(4.333), Inches(0.9))
        tf_cap5 = cap5_box.text_frame
        tf_cap5.word_wrap = True
        tf_cap5.margin_left = tf_cap5.margin_top = tf_cap5.margin_right = tf_cap5.margin_bottom = 0
        p_cap5 = tf_cap5.paragraphs[0]
        p_cap5.alignment = PP_ALIGN.LEFT
        p_cap5.text = "Figure 5: Spacesuit hyperoxic regime (100% O2 at 4.3 psi) vs. Moon Base intermediate atmosphere (34% O2 at 10.2 psi), highlighting the trade-off between mobility and flammability risk."
        p_cap5.font.size = Pt(9.5)
        p_cap5.font.italic = True
        p_cap5.font.color.rgb = COLOR_SLATE

    cfig_box = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.0), Inches(5.45), Inches(4.333), Inches(1.15))
    cfig_box.fill.solid()
    cfig_box.fill.fore_color.rgb = COLOR_CARD_ALT
    cfig_box.line.color.rgb = COLOR_ROSE
    tf_cfig = cfig_box.text_frame
    tf_cfig.word_wrap = True
    tf_cfig.margin_left = tf_cfig.margin_right = tf_cfig.margin_top = tf_cfig.margin_bottom = Inches(0.12)
    p_cft = tf_cfig.paragraphs[0]
    p_cft.alignment = PP_ALIGN.LEFT
    p_cft.text = "ACME CFI-G: INSIDE-OUT DIFFUSION RECORD"
    p_cft.font.size = Pt(10.5)
    p_cft.font.bold = True
    p_cft.font.color.rgb = COLOR_ROSE
    p_cfb = tf_cfig.add_paragraph()
    p_cfb.alignment = PP_ALIGN.LEFT
    p_cfb.text = "Chamber filled with N2 + fuel gas (propane); oxidizer stream enriched up to 85% O2 flowed from a porous spherical burner, establishing stable inverted radical envelopes."
    p_cfb.font.size = Pt(9.2)
    p_cfb.font.color.rgb = COLOR_WHITE

    add_footer(slide5)

    # ═════════════════════════════════════════════════════════════════════════════
    # SLIDE 6: Partial-Gravity Bounding Physics & Hardware Lineages
    # ═════════════════════════════════════════════════════════════════════════════
    slide6 = prs.slides.add_slide(blank_layout)
    bg6 = slide6.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg6.fill.solid()
    bg6.fill.fore_color.rgb = COLOR_BG
    bg6.line.color.rgb = COLOR_BG

    add_header(slide6, "Physics Scaling Laws & Flight Hardware", "Bounding Partial Gravity & Tracing Flight Lineages", 6)

    card6_l = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(6.8), Inches(5.3))
    card6_l.fill.solid()
    card6_l.fill.fore_color.rgb = COLOR_CARD
    card6_l.line.color.rgb = COLOR_CARD_BORDER

    tf6 = card6_l.text_frame
    tf6.word_wrap = True
    tf6.margin_left = tf6.margin_right = tf6.margin_top = tf6.margin_bottom = Inches(0.25)

    p_t = tf6.paragraphs[0]
    p_t.alignment = PP_ALIGN.LEFT
    p_t.text = "DETERMINISTIC PHYSICS: BRIDGING 0g AND 1g"
    p_t.font.size = Pt(11.5)
    p_t.font.bold = True
    p_t.font.color.rgb = COLOR_CYAN
    p_t.space_after = Pt(2)

    physics_laws = [
        ("Roper Flame Height Scaling", "L_f(g) = L_f(1g) · g^(-0.25) — Earth (1g): 30 mm | Mars (0.38g): 38.2 mm (+27%) | Moon (0.166g): 47.0 mm (+57%) | 0g: Asymptotically bounded spherical dome (~75 mm)."),
        ("Grashof Convective Draft", "u_conv ∝ √(2·g·β·ΔT·L) — Earth: 0.55 m/s (strong buoyant flicker) | Moon: 0.23 m/s (-59%) | 0g: 0.00 m/s (pure molecular diffusion, high risk of quiescent smoldering)."),
        ("ACME E-FIELD Ionic Mimicry", "Electric fields applied across flames exert Lorentz body forces on ions (CHO+, H3O+), experimentally mimicking partial-gravity buoyant acceleration in 0g."),
        ("ACME BRE Emulation", "Burning Rate Emulator used gaseous fuels in still air to emulate condensed solid materials flammability across thermal conductivity and thickness variables.")
    ]

    for title, detail in physics_laws:
        p_pl = tf6.add_paragraph()
        p_pl.alignment = PP_ALIGN.LEFT
        p_pl.text = f"• {title}: "
        p_pl.font.size = Pt(9.8)
        p_pl.font.bold = True
        p_pl.font.color.rgb = COLOR_AMBER

        run = p_pl.add_run()
        run.text = detail
        run.font.size = Pt(9.1)
        run.font.bold = False
        run.font.color.rgb = COLOR_WHITE
        p_pl.space_after = Pt(4)

    p_hw = tf6.add_paragraph()
    p_hw.alignment = PP_ALIGN.LEFT
    p_hw.text = "HARDWARE LINEAGES & INSTRUMENT REPURPOSING:"
    p_hw.font.size = Pt(10.5)
    p_hw.font.bold = True
    p_hw.font.color.rgb = COLOR_GREEN
    p_hw.space_before = Pt(4)
    p_hw.space_after = Pt(2)

    hw_text = (
        "• SAME -> DAFT Evolution: Smoke Aerosol Measurement Exp. sensor was flight-repurposed on the ISS into the DAFT/DAFT-2 lunar regolith dust sensor.\n"
        "• CIR Modular Hardware: Hosted 6 ACME gaseous experiments + MDCA liquid droplet combustion (FLEX, FLEX-2, CFI cool flames).\n"
        "• MSG SPICE Flow Duct: Reusable fan duct powered BASS, BASS-II, SPICE, and SLICE.\n"
        "• Partial Gravity Precedents: LUCI (Gateway) & FM2 (Lunar surface flammability)."
    )
    p_hwb = tf6.add_paragraph()
    p_hwb.alignment = PP_ALIGN.LEFT
    p_hwb.text = hw_text
    p_hwb.font.size = Pt(8.8)
    p_hwb.font.color.rgb = COLOR_WHITE

    card6_r = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.5), Inches(4.733), Inches(5.3))
    card6_r.fill.solid()
    card6_r.fill.fore_color.rgb = COLOR_CARD
    card6_r.line.color.rgb = COLOR_CARD_BORDER

    img6_path = str(repo_root / "frontend" / "public" / "assets" / "cards" / "art_circuit@2x.png")
    if os.path.exists(img6_path):
        i_left, i_top, i_w, i_h = fit_image_box(img6_path, Inches(8.0), Inches(1.7), Inches(4.333), Inches(2.7))
        slide6.shapes.add_picture(img6_path, i_left, i_top, i_w, i_h)

        cap6_box = slide6.shapes.add_textbox(Inches(8.0), Inches(4.45), Inches(4.333), Inches(0.9))
        tf_cap6 = cap6_box.text_frame
        tf_cap6.word_wrap = True
        tf_cap6.margin_left = tf_cap6.margin_top = tf_cap6.margin_right = tf_cap6.margin_bottom = 0
        p_cap6 = tf_cap6.paragraphs[0]
        p_cap6.alignment = PP_ALIGN.LEFT
        p_cap6.text = "Figure 6: Deterministic gravity scaling laws and hardware lineage mapping from ISS CIR/MSG racks to Artemis surface testbeds."
        p_cap6.font.size = Pt(9.5)
        p_cap6.font.italic = True
        p_cap6.font.color.rgb = COLOR_SLATE

    lin_box = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.0), Inches(5.45), Inches(4.333), Inches(1.15))
    lin_box.fill.solid()
    lin_box.fill.fore_color.rgb = COLOR_CARD_ALT
    lin_box.line.color.rgb = COLOR_CYAN
    tf_lin = lin_box.text_frame
    tf_lin.word_wrap = True
    tf_lin.margin_left = tf_lin.margin_right = tf_lin.margin_top = tf_lin.margin_bottom = Inches(0.12)
    p_lt = tf_lin.paragraphs[0]
    p_lt.alignment = PP_ALIGN.LEFT
    p_lt.text = "BOUNDED GRAVITY DOMAIN"
    p_lt.font.size = Pt(10.5)
    p_lt.font.bold = True
    p_lt.font.color.rgb = COLOR_CYAN
    p_lb = tf_lin.add_paragraph()
    p_lb.alignment = PP_ALIGN.LEFT
    p_lb.text = "0.00g (ISS Quiescent) < 0.166g (Moon) < 0.38g (Mars) < 1.00g (Earth Sea Level). Mathematical bounding enforces non-divergent physics."
    p_lb.font.size = Pt(9.2)
    p_lb.font.color.rgb = COLOR_WHITE

    add_footer(slide6)

    # ═════════════════════════════════════════════════════════════════════════════
    # SLIDE 7: Terrestrial Applications & Earth Spinoffs
    # ═════════════════════════════════════════════════════════════════════════════
    slide7 = prs.slides.add_slide(blank_layout)
    bg7 = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg7.fill.solid()
    bg7.fill.fore_color.rgb = COLOR_BG
    bg7.line.color.rgb = COLOR_BG

    add_header(slide7, "Life Safety Spinoffs & Exploration Impact", "From Orbital Racks to Earth: Firefighting Spinoffs", 7)

    card7_l = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(6.8), Inches(5.3))
    card7_l.fill.solid()
    card7_l.fill.fore_color.rgb = COLOR_CARD
    card7_l.line.color.rgb = COLOR_CARD_BORDER

    tf7 = card7_l.text_frame
    tf7.word_wrap = True
    tf7.margin_left = tf7.margin_right = tf7.margin_top = tf7.margin_bottom = Inches(0.25)

    spinoffs = [
        ("FINE-WATER MIST SUPPRESSION (FLEX / FLEX-2)",
         "Developed for the ISS to replace toxic halon without suffocating crew ECLSS life support. Commercialized into high-efficiency mist nozzles for data centers, historical archives, and passenger subways where water deluge causes catastrophic collateral damage.",
         COLOR_CYAN),
        ("DUAL-WAVELENGTH OPTICAL SMOKE DETECTION (SAME / DAFT)",
         "Designed to detect microgravity soot without relying on buoyant updrafts. Evolved into commercial early-warning smoke sensors for underground coal mines, semiconductor cleanrooms, and aircraft cargo holds, cutting false dust alarms by >85%.",
         COLOR_AMBER),
        ("FIREFIGHTER TURNOUT GEAR & COMPOSITE TANKS (BASS / SAFFIRE)",
         "Advanced Nomex, Kevlar, and PBI thermal barrier fabrics tested in BASS and Saffire large-scale burns directly standardized modern municipal firefighter turnout coats and lightweight carbon-fiber SCBA breathing tanks resisting flashover up to 1,000°F (538°C).",
         COLOR_ROSE),
        ("SUMMARY: THE NEXT GIANT LEAP, SAFER",
         "PROJECT PYROS bridges esoteric spaceflight experiments to practical engineering tools. By turning complex microgravity data into clear answers, it safeguards astronaut crews on the Moon and Mars while saving lives on Earth.",
         COLOR_GREEN)
    ]

    for idx, (title, desc, color) in enumerate(spinoffs):
        p_t = tf7.paragraphs[0] if idx == 0 else tf7.add_paragraph()
        p_t.alignment = PP_ALIGN.LEFT
        p_t.text = title
        p_t.font.size = Pt(10.5)
        p_t.font.bold = True
        p_t.font.color.rgb = color
        p_t.space_after = Pt(2)

        p_d = tf7.add_paragraph()
        p_d.alignment = PP_ALIGN.LEFT
        p_d.text = desc
        p_d.font.size = Pt(9.3)
        p_d.font.color.rgb = COLOR_WHITE
        p_d.space_after = Pt(7)

    card7_r = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.5), Inches(4.733), Inches(5.3))
    card7_r.fill.solid()
    card7_r.fill.fore_color.rgb = COLOR_CARD
    card7_r.line.color.rgb = COLOR_CARD_BORDER

    img7_path = str(repo_root / "frontend" / "public" / "assets" / "showcase" / "art_earth_sphere@2x.png")
    if not os.path.exists(img7_path):
        img7_path = str(repo_root / "frontend" / "public" / "assets" / "showcase" / "panel_earth@2x.png")

    if os.path.exists(img7_path):
        i_left, i_top, i_w, i_h = fit_image_box(img7_path, Inches(8.0), Inches(1.7), Inches(4.333), Inches(2.7))
        slide7.shapes.add_picture(img7_path, i_left, i_top, i_w, i_h)

        cap7_box = slide7.shapes.add_textbox(Inches(8.0), Inches(4.45), Inches(4.333), Inches(0.9))
        tf_cap7 = cap7_box.text_frame
        tf_cap7.word_wrap = True
        tf_cap7.margin_left = tf_cap7.margin_top = tf_cap7.margin_right = tf_cap7.margin_bottom = 0
        p_cap7 = tf_cap7.paragraphs[0]
        p_cap7.alignment = PP_ALIGN.LEFT
        p_cap7.text = "Figure 7: Dual-impact paradigm: How NASA PSI spaceflight research translates directly into life-saving municipal firefighting equipment and cleanroom sensor technology on Earth."
        p_cap7.font.size = Pt(9.5)
        p_cap7.font.italic = True
        p_cap7.font.color.rgb = COLOR_SLATE

    final_box = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.0), Inches(5.45), Inches(4.333), Inches(1.15))
    final_box.fill.solid()
    final_box.fill.fore_color.rgb = COLOR_CARD_ALT
    final_box.line.color.rgb = COLOR_CYAN
    tf_f = final_box.text_frame
    tf_f.word_wrap = True
    tf_f.margin_left = tf_f.margin_right = tf_f.margin_top = tf_f.margin_bottom = Inches(0.12)
    p_ft = tf_f.paragraphs[0]
    p_ft.alignment = PP_ALIGN.LEFT
    p_ft.text = "NASA SPACE APPS CHALLENGE 2026"
    p_ft.font.size = Pt(10.5)
    p_ft.font.bold = True
    p_ft.font.color.rgb = COLOR_CYAN
    p_fb = tf_f.add_paragraph()
    p_fb.alignment = PP_ALIGN.LEFT
    p_fb.text = "PROJECT PYROS // Ready for Mission Deployment & Terrestrial Licensing.\nTurning Complex Data into Clear Answers."
    p_fb.font.size = Pt(9.3)
    p_fb.font.color.rgb = COLOR_WHITE

    add_footer(slide7)

    prs.save(output_path)
    print(f"[SUCCESS] Presentation generated successfully: {output_path}")
    print(f"Total Slides: {len(prs.slides)}")


if __name__ == "__main__":
    out_file = os.path.join(os.getcwd(), "PROJECT_PYROS_NASA_7_SLIDES.pptx")
    create_presentation(out_file)
