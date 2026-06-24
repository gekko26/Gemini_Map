from pypdf import PdfReader
import subprocess 
import time
import re


response = subprocess.run("pip install pypdf",capture_output=True,text=True,shell=True)
print(response.stdout)


def calculate_grade(student_grades):
   data = []
   numer = 0
   denom = 0
   for keys, values in student_grades.items():
    (_,subject), (_,unit), (_,grade)= values.items() 
    data.append((subject,float(unit),float(grade)))

   
   for subject, unit,grade in data:
      print(f"Subject: [{subject}] Grade: [{grade}] Units: [{unit}]")
      numer+=grade*unit
      denom+=unit

   gwa = numer/denom
   confirm = input("\n\n###################################################\nPLEASE DOUBLE CHECK [Grades], [Unit], and [Subject]\nMake sure all subjects have grades\nAre all the above info are correct?[y/n]: ")
   if "y" == confirm.lower():
     print("Starting Calculation now.....")
     time.sleep(4)
     print("Performing arithmetic...")
     time.sleep(1)
     print("Using my 100% power for better accuracy...")
     time.sleep(3)
     print("hello world!")
     time.sleep(1)
     print("Just kidding, your gpa is...")
     time.sleep(2)
     print(f"Your GWA: {round(gwa,3)} ")
   else:
      print("BYE!!!")



def process_pdf(file):
 try:   
  reader = PdfReader(file)
 
  text = ""

  for page in reader.pages:
    text+=page.extract_text()

  lines = " ".join(text.split())
  student_grades = {}
  id = 0
  pattern = r"(?P<code>CE\d+)\s+([\w\- ]+?)\s+(?P<subject>[A-Z]+[ ,\w/:\-\)\(]+\d{0,1})"\
           r"\s+(?P<unit>[.\d]{3,4})"\
           r"\s+(\d{2}:\d{2}(?:AM|PM)-\d{2}:\d{2}(?:AM|PM))\s+([A-Za-z]+)\s+([A-Za-z. ]*[\d]{0,3}\s+(?=(?P<grade>\d{1}\.\d{1,2})))"
        
  for match in re.finditer(pattern,lines):
    student_grades[id] = {"subject": match.group("subject"), "unit": match.group("unit"), "grade": match.group("grade")} 
    id +=1
 except FileNotFoundError:
     print(f"{file} not found")
 except Exception as e:
     print(f"Error: {e}")
 return calculate_grade(student_grades)  




while True:
 file = input("Make sure file is located is located in the same directory of the code\nEnter file name: ")
 if file:
    try:
       process_pdf(file)
       break
    except UnboundLocalError:
       print(f"{file} corrupted make sure it .pdf")
   
 else:
    print(f"you enter nothing")