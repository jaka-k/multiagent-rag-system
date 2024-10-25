const TermsPage = () => {
  return (
    <div className="font-light container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-xl uppercase mb-4">Privacy Policy</h1>
      <p className="text-sm text-gray-600 mb-8">
        Last updated: 25th of October 2024
      </p>

      <section className="mb-6">
        <h2 className="text-xl  mb-2">1. Introduction</h2>
        <p className="mb-4">
          Welcome to <strong>Anki Tutor</strong>. We are committed to protecting
          your personal information and your right to privacy. This Privacy
          Policy explains how we collect, use, disclose, and safeguard your
          information when you use our application.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl mb-2">2. Information We Collect</h2>
        <ul className="list-item list-inside mb-4">
          <li>
            <strong>Authentication Tokens:</strong> We store authentication
            tokens in cookies to keep you securely logged in and to ensure the
            smooth functioning of the app.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className=" text-xl  mb-2">3. Cookies</h2>
        <p className="mb-4">
          Cookies are small text files stored on your device (computer or mobile
          device) when you visit a website or use an application.
        </p>
        <h3 className="text-xl  mb-2">Essential Cookies</h3>
        <p className="mb-4">
          These cookies are necessary for the app to function and cannot be
          switched off in our systems. They are usually only set in response to
          actions made by you, such as logging in or filling in forms.
        </p>
        <h3 className="text-xl mb-2">Your Choices Regarding Cookies</h3>
        <p className="mb-4">
          Since we only use essential cookies for authentication purposes,
          disabling them may affect the functionality of the app.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl  mb-2">4. How We Use Your Information</h2>
        <ul className="list-disc list-inside mb-4">
          <li>Keep you logged into your account.</li>
          <li>Ensure the security and integrity of our services.</li>
          <li>Improve user experience by maintaining session information.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className=" text-xl  mb-2">5. Data Security</h2>
        <p className="mb-4">
          We implement reasonable security measures to protect your personal
          information. However, please be aware that no security measures are
          perfect or impenetrable.
        </p>
      </section>

      <section className="mb-6">
        <h2 className=" text-xl  mb-2">6. Your Rights</h2>
        <ul className="list-item list-inside mb-4">
          <li>
            <strong>Access:</strong> You have the right to access the personal
            data we hold about you.
          </li>
          <li>
            <strong>Request Correction:</strong> You can request correction of
            any inaccuracies in your personal data.
          </li>
          <li>
            <strong>Request Deletion:</strong> You can request deletion of your
            personal data under certain circumstances.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className=" text-xl mb-2">7. Contact Us</h2>
        <p className="mb-4">
          If you have any questions or concerns about this Privacy Policy,
          please contact us at:
        </p>
        <ul className="list-item list-inside mb-4">
          <li>
            <strong>Email:</strong>{' '}
            <a
              href="mailto:info@krajnc.cc"
              className="text-blue-600 hover:underline"
            >
              info@krajnc.cc
            </a>
          </li>
        </ul>
      </section>
      <section className="mb-6">
        <h2 className="text-xl mb-2">8. Changes to This Privacy Policy</h2>
        <p className="mb-4">
          We may update our Privacy Policy from time to time. We will notify you
          of any changes by updating the &quot;Last updated&quot; date at the
          top of this Privacy Policy.
        </p>
      </section>
    </div>
  )
}

export default TermsPage
