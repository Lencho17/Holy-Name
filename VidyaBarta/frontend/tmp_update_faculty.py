import os

jsx_content = """import React, { useContext } from 'react';
import { SiteDataContext } from '../context/SiteDataContext';

const Faculty = () => {
  const { faculty: facultyData, schoolProfile } = useContext(SiteDataContext);

  const displayFaculty = (facultyData && Object.keys(facultyData).length > 0) 
    ? Object.values(facultyData).flat() 
    : [
        {
          name: "Dr. Robert Chen",
          jobTitle: "Head of Science Department",
          photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwEjriwnFCjU6sg1ESJQZFB6A5hnqMINFxoHPlHmGMMStXtNpCXRonUZl2ZSPBtInCcW3grYUSeBFO51DofYe8ZX0gjgU0A5PX_kYxflc9NmqkytL0YE0ZL6M0pbCP16GW_fcJjPXJ_xxXCUgreaO_qQJ1dyVvAizw78fTiUdSIljW1lxsXbZ3RksmiWasnOOFuTWF7mEqX5KXL3FQWT1WUwrAdpZi-OZ9HAmVAkStRXoHeIZR2iYSN2QLMr8rgU7jhHFl090jfXw",
          Subject: "Science"
        },
        {
          name: "Prof. Sarah J.",
          jobTitle: "Head of Liberal Arts",
          photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBBJpFZPEhsyFBjsGmsxPrtH1vxf69vZ79A_JekXb94OF4YxTXACFVwa3wYyrLWDdRiQaDCFRz8O5Zte9yET_MjyTc5iIGhR9v-siQ7kKZ7Xa6ohKlpC4XTpPwr8_boP9IQZ4l-gecj6fTKae4GGa1Chy4KsPvHzx6sx-cti1TD2MDKcpDYS3fSdCqG7x0hIjeH67SZHQp8An6DaoIw7Kp4SiYlGF5gms7y9Pfo6nE2txlWEuW7taLpFs90OnutG6cGBejIHiO5U_8",
          Subject: "Arts"
        },
        {
          name: "Dr. Amit Sharma",
          jobTitle: "Head of Commerce",
          photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJiD_iXb6ZJuNt2Hz2xAtl9icP4zy4ulS85lZoBOroEwXgW3oHikzyPapMNg8j13qW7rJ0ODaIWs4u4vU5-vOCcH1Td7NI66omhItMzL488HH0IWhJbA5KjAdJ1thpHjI0yaPHxjMZbQ1rz4ZG6OLspGNj02smMypQG6hOoXpg4DZeWCYG2GsRxddOJ3Ftht6npdoyLmILT0BWesAUdvGK4xqj9FYF6UrO9HWyu1Kll4_BdQJDXC8sSK2pSPorTjqDEVq-MnwCKXs",
          Subject: "Commerce"
        },
        {
          name: "Dr. Elena K.",
          jobTitle: "Dean of Admissions",
          photo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqzgvLZ68OT4MAh7NDY8RFG8rdG2YHt5YSFUfn1IwzU0G-Jq2tSnatlE7CkivOa1R2KwcNZWNlE5_R0GAhQOD6__9V1i1NDQ2ZJ89DJInRsb-rc7pf08YG3jJBAINxXf4-49bUfetlnbJdzs-zG-Gz05qtfa-kq9WA2IacIgVI0BOiCgezECXeMZN5ygeGbK4DAU_0zW3WeZjsvvcXnRkS7LYBDIoVa6raQL270AXuOJ5U7S7fjn2HzatT_g5-5VGV7EHKllReEqk",
          Subject: "Administration"
        }
      ];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      <main className="max-w-container-max mx-auto px-6 py-12">
        {/* Meet Our Faculty Section */}
        <section className="py-20" id="faculty">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-xs mb-4 block">Our Mentors</span>
            <h2 className="font-headline-lg text-headline-lg text-on-background">Meet Our Faculty</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto mt-4">Led by distinguished scholars and industry veterans committed to academic excellence.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayFaculty.slice(0, 8).map((member, idx) => (
              <div key={idx} className="group relative overflow-hidden bg-white rounded-2xl border border-outline-variant hover:border-primary transition-all duration-500">
                <div className="aspect-[4/5] overflow-hidden">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt={member.name} 
                    src={member.photo || "https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=400&h=500&fit=crop"}
                  />
                </div>
                <div className="p-6 bg-white relative z-10">
                  <h4 className="font-headline-md text-[20px] text-on-surface mb-1">{member.name}</h4>
                  <p className="text-primary font-label-md mb-4">{member.jobTitle || member.Subject || 'Faculty'}</p>
                  <div className="flex gap-4 border-t border-outline-variant pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a className="text-on-surface-variant hover:text-primary" href="#"><span className="material-symbols-outlined text-sm">mail</span></a>
                    <a className="text-on-surface-variant hover:text-primary" href="#"><span className="material-symbols-outlined text-sm">person</span></a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {displayFaculty.length > 8 && (
            <div className="mt-12 text-center">
              <button className="bg-surface-container-high text-on-surface-variant px-10 py-3 rounded-full font-label-md hover:bg-primary hover:text-white transition-all shadow-sm">View Full Directory</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Faculty;
"""

with open('/home/zerosync/Documents/Holy-Name/VidyaBarta/frontend/src/Components/Faculty.jsx', 'w') as f:
    f.write(jsx_content)

print("Faculty.jsx updated successfully!")
