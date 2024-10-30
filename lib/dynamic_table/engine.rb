module DynamicTable
  class Engine < ::Rails::Engine
    initializer "dynamic_table.assets.precompile" do |app|
      puts "DynamicTable Engine Loaded" # Debugging statemen
      app.config.assets.precompile += %w(dynamic_table.scss dynamic_table.js)
    end
    puts "DynamicTable Engine Loaded2" # Debugging statemen
  end
end
