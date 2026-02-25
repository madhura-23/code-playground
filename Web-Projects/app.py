import streamlit as st
import fitz
import os
import re
from utils import extract_entities


# ─── Page Config ───────────────────────────────────────────────
st.set_page_config(page_title="AI Resume Analyzer", page_icon="📄", layout="centered")

st.title("📄 AI Resume Analyzer")
st.markdown("Upload your resume and paste a job description to see how well they match.")

# ─── Helper: Extract text from PDF ─────────────────────────────
def extract_text_pymupdf(pdf_file):
    text = ""
    doc = fitz.open(stream=pdf_file.read(), filetype="pdf")
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()

# ─── Helper: Calculate match score without ML ──────────────────
def calculate_match_score(resume_text, job_desc):
    resume_words = set(re.findall(r'\b\w{4,}\b', resume_text.lower()))
    jd_words     = set(re.findall(r'\b\w{4,}\b', job_desc.lower()))
    if not jd_words:
        return 0.0
    overlap = resume_words & jd_words
    score = round((len(overlap) / len(jd_words)) * 100, 2)
    return min(score, 100.0)  # cap at 100

# ─── UI: Inputs ────────────────────────────────────────────────
resume_file = st.file_uploader("📎 Upload Resume (PDF)", type=["pdf"])
job_desc    = st.text_area("📋 Paste Job Description Here", height=200)

if st.button("🔍 Analyze"):

    if not resume_file:
        st.error("Please upload a resume PDF.")
    elif not job_desc.strip():
        st.error("Please enter a job description.")
    else:
        with st.spinner("Analyzing your resume..."):

            # Extract resume text
            resume_text = extract_text_pymupdf(resume_file)

            # Match Score
            match_score = calculate_match_score(resume_text, job_desc)

            # Skills extraction
            resume_entities = extract_entities(resume_text)
            resume_skills   = set(w.lower() for w in resume_entities.get('SKILL', []))

            jd_words       = set(re.findall(r'\b\w{4,}\b', job_desc.lower()))
            matched_skills = sorted(jd_words & resume_skills)
            missing_skills = sorted(jd_words - resume_skills)[:10]

            # Suggestions
            suggestions = []
            if "flask" in jd_words and "flask" not in resume_text.lower():
                suggestions.append("Mention your experience with Flask or similar web frameworks.")
            if "sql" in jd_words and "sql" not in resume_text.lower():
                suggestions.append("Include your experience with SQL databases.")
            if "api" in jd_words and "api" not in resume_text.lower():
                suggestions.append("Describe projects where you built or worked with APIs.")
            if len(resume_text.split()) < 150:
                suggestions.append("Your resume seems short. Add more details about your experience and skills.")
            if not any(h in resume_text.lower() for h in ["experience", "work", "project"]):
                suggestions.append("Consider adding an 'Experience' or 'Projects' section.")

        # ─── Results ───────────────────────────────────────────
        st.divider()
        st.subheader("📊 Results")

        # Match Score with color
        color = "green" if match_score >= 60 else "orange" if match_score >= 35 else "red"
        st.markdown(f"### Match Score: :{color}[{match_score}%]")
        st.progress(int(match_score))

        col1, col2 = st.columns(2)

        with col1:
            st.markdown("#### ✅ Matched Skills")
            if matched_skills:
                for skill in matched_skills:
                    st.success(skill)
            else:
                st.info("No matched skills found.")

        with col2:
            st.markdown("#### ❌ Missing Skills")
            if missing_skills:
                for skill in missing_skills:
                    st.error(skill)
            else:
                st.info("No major missing skills.")

        st.markdown("#### 💡 Suggestions")
        if suggestions:
            for s in suggestions:
                st.warning(s)
        else:
            st.success("Your resume looks well-aligned with the job description!")