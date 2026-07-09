import sys

def patch_signup_file(file_path, title, subtitle):
    with open(file_path, 'r') as f:
        content = f.read()

    return_start = content.find("  return (")
    if return_start == -1:
        print(f"Could not find return statement in {file_path}")
        return

    inner_start = content.find("<form")
    if inner_start == -1:
        print("Could not find <form> tag")
        return
        
    inner_end = content.find("        </div>\n      </div>\n    </div>\n  );")
    if inner_end == -1:
        inner_end = content.find("          </div>\n        </div>\n\n      </div>\n    </div>")

    if inner_end == -1:
        print(f"Could not find form end in {file_path}")
        return

    # Extract all the inner content up to inner_end (this includes </form> and the "Already have an account?" text)
    # The inner_end usually matches the end of the white card.
    # Let's find the exact point where we should stop: after the "Already have an account?" div.
    # We will search for "</form>" and then the next "</div>" which closes the form's wrapper.
    form_close_idx = content.find("</form>")
    if form_close_idx != -1:
        # include "Already have an account?" div
        next_div_idx = content.find("</div>", form_close_idx + 7)
        if next_div_idx != -1:
            next_div_idx = content.find("</div>", next_div_idx + 6)
            inner_end = next_div_idx + 6
        
    inner_content = content[inner_start:inner_end]

    new_wrapper_start = f"""  return (
    <div className="min-h-screen flex font-sans bg-white">
      {{/* Left Image Panel */}}
      <div className="hidden lg:flex lg:w-5/12 relative">
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10"></div>
        <img
          src="/modern_classroom.png"
          alt="Modern Classroom"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {{/* Text Overlay */}}
        <div className="relative z-20 flex flex-col justify-end h-full w-full p-12 xl:p-16">
          <div className="mt-auto">
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight font-headline">
              Welcome to {{schoolProfile?.name || "School"}}
            </h1>
            <p className="text-slate-200 text-lg leading-relaxed max-w-md">
              Join our educational ecosystem. Fill in your details to get started.
            </p>
          </div>
        </div>
      </div>

      {{/* Right Login Panel */}}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
        {{/* Top Right Logo */}}
        <div className="absolute top-8 right-8 xl:top-12 xl:right-12">
          {{schoolProfile?.logo ? (
             <img src={{schoolProfile.logo}} alt={{schoolProfile.name}} className="h-auto w-32 md:w-40 xl:w-48 object-contain" />
          ) : (
             <img src="/logo.png" alt="VidyaBarta" className="h-auto w-40 md:w-48 xl:w-56 object-contain" />
          )}}
        </div>
        
        <div className="w-full max-w-md mt-10 lg:mt-0">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight font-headline">{title}</h2>
            <p className="text-slate-500 text-base">{subtitle}</p>
          </div>
          
"""
    
    new_wrapper_end = """
        </div>
      </div>
    </div>
  );
}
"""
    
    new_content = content[:return_start] + new_wrapper_start + "          " + inner_content + new_wrapper_end + "\nexport default " + file_path.split("/")[-1].split(".")[0] + ";"
    
    with open(file_path, 'w') as f:
        f.write(new_content)
    print(f"Patched {file_path}")

patch_signup_file('VidyaBarta/frontend/src/Components/StaffSignUp.jsx', 'Staff Sign Up', 'Create an account to access the staff portal.')
patch_signup_file('VidyaBarta/frontend/src/Components/AdminSignUp.jsx', 'Admin Sign Up', 'Create a school admin account to manage your institution.')
