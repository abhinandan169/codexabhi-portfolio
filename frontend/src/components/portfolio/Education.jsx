import React from 'react';
import { GraduationCap } from 'lucide-react';

const Education = ({ education }) => (
  <section id="education" className="section-y bg-[#FAFAFA]" data-testid="education-section">
    <div className="container-x">
      <div className="max-w-2xl">
        <span className="eyebrow">Education</span>
        <h2 className="text-3xl sm:text-5xl font-bold mt-2">
          Academic <span className="text-[#E53935]">background.</span>
        </h2>
      </div>

      <div className="mt-12 relative" data-testid="education-timeline">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-[#E5E7EB] hidden sm:block"></div>
        <div className="space-y-6">
          {education.map((e) => (
            <div key={e.id} className="relative sm:pl-16" data-testid={`education-${e.id}`}>
              <div className="hidden sm:flex absolute left-0 top-4 w-12 h-12 rounded-2xl bg-[#E53935] text-white items-center justify-center shadow-md">
                <GraduationCap size={22} />
              </div>
              <div className="card-soft p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">{e.degree}</h3>
                    <p className="text-[#555555] mt-1">{e.college}{e.university ? ` · ${e.university}` : ''}</p>
                  </div>
                  <div className="text-right">
                    {e.passing_year && <p className="badge-red">{e.passing_year}</p>}
                    {e.cgpa && <p className="text-sm text-[#555555] mt-1 mono">CGPA: {e.cgpa}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {education.length === 0 && (
            <p className="text-[#888888]" data-testid="education-empty">No education entries yet.</p>
          )}
        </div>
      </div>
    </div>
  </section>
);

export default Education;
