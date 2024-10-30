# frozen_string_literal: true

require_relative "lib/dynamic_table/version"

Gem::Specification.new do |spec|
  spec.name = "dynamic_table"
  spec.version = DynamicTable::VERSION
  spec.authors = ["jayanth"]
  spec.email = ["jayanth.ravindran@gmail.com"]

  spec.summary = "Gem to create editable tables dynamically using javascript"
  spec.description = "This GEM is an attempt to create editable tables wherein cells may contain text, dates, select,decimals and so on.
  You can select a set of cells and paste data. Paste from excel or other spreadsheets on to the same. You can add styles at a column
  or row level as well."
  # spec.homepage = "TBD" #add Github repo link
  spec.required_ruby_version = ">= 3.0.0"

  spec.metadata["allowed_push_host"] = "https://rubygems.org"

  # spec.metadata["homepage_uri"] = ""
  # spec.metadata["source_code_uri"] = "TBD"
  # spec.metadata["changelog_uri"] = "TBD"

   # Dependency on Rails or Sprockets for asset loading
  spec.add_dependency "sprockets", "~> 3.7" if defined?(Rails)

  spec.require_paths = ["lib"]
  spec.files = Dir["lib/**/*", "app/assets/**/*"]

  # Uncomment to register a new dependency of your gem
  # spec.add_dependency "example-gem", "~> 1.0"

  # For more information and examples about making a new gem, check out our
  # guide at: https://bundler.io/guides/creating_gem.html
end
