from skills import job_roles

def read_resume():
    with open("resume.txt", "r") as file:
        return file.read().lower()

def analyze_resume(resume_text, role):
    required_skills = job_roles.get(role)

    if not required_skills:
        return None

    found_skills = []
    missing_skills = []

    for skill in required_skills:
        if skill in resume_text:
            found_skills.append(skill)
        else:
            missing_skills.append(skill)

    match_percentage = (len(found_skills) / len(required_skills)) * 100

    return found_skills, missing_skills, match_percentage

def main():
    print("Available roles:")
    for role in job_roles:
        print("-", role)

    role = input("\nEnter target job role: ").lower()
    resume_text = read_resume()

    result = analyze_resume(resume_text, role)

    if result is None:
        print("Role not found.")
        return

    found, missing, match = result

    print("\n📊 Resume Analysis Result")
    print("Matched Skills:", found)
    print("Missing Skills:", missing)
    print(f"Match Percentage: {match:.2f}%")

    if match < 60:
        print("\n⚠ Suggestion: Improve your resume by adding missing skills.")
    else:
        print("\n✅ Good fit for the role!")

if __name__ == "__main__":
    main()
