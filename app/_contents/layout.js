export default function forumsLayout({
    children, // will be a page or nested layout
  }) {
    return (
      <section>
        {/* Include shared UI here e.g. a header or sidebar */}
        <div className="container h-full w-full ">{children}</div>
   
        
      </section>
    )
  }